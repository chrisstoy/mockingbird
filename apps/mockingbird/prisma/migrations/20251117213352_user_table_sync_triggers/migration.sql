-- Migration: User Table Sync Triggers
-- This migration sets up PostgreSQL triggers to automatically sync the User table
-- with Supabase's auth.users table, making User a read-only cache.

-- Step 1: Clear all data (fresh start approach)
TRUNCATE TABLE "Post", "Friends", "Image", "Album", "Document" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- Step 2: Drop all foreign key constraints that reference User.id
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_posterId_fkey";
ALTER TABLE "Friends" DROP CONSTRAINT IF EXISTS "Friends_userId_fkey";
ALTER TABLE "Image" DROP CONSTRAINT IF EXISTS "Image_ownerId_fkey";
ALTER TABLE "Album" DROP CONSTRAINT IF EXISTS "Album_ownerId_fkey";

-- Step 3: Alter User.id to UUID type (no default - comes from Supabase)
ALTER TABLE "User" ALTER COLUMN "id" TYPE UUID USING id::uuid;
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- Step 4: Alter all foreign key columns that reference User.id to UUID
ALTER TABLE "Post" ALTER COLUMN "posterId" TYPE UUID USING "posterId"::uuid;
ALTER TABLE "Friends" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "Friends" ALTER COLUMN "friendId" TYPE UUID USING "friendId"::uuid;
ALTER TABLE "Image" ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;
ALTER TABLE "Album" ALTER COLUMN "ownerId" TYPE UUID USING "ownerId"::uuid;
ALTER TABLE "Document" ALTER COLUMN "creatorId" TYPE UUID USING "creatorId"::uuid;

-- Step 5: Recreate foreign key constraints
ALTER TABLE "Post" ADD CONSTRAINT "Post_posterId_fkey"
  FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Image" ADD CONSTRAINT "Image_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Album" ADD CONSTRAINT "Album_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Create trigger function for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    name,
    image,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 7: Create INSERT trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Create trigger function for user profile updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public."User"
  SET
    email = NEW.email,
    name = COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      name
    ),
    image = COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
      image
    ),
    "updatedAt" = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_user_update: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 9: Create UPDATE trigger on auth.users (only when metadata/email changes)
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
    OR OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.handle_user_update();

-- Step 10: Create trigger function for user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public."User"
  WHERE id = OLD.id;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_user_delete: %', SQLERRM;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 11: Create DELETE trigger on auth.users
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();
