import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase admin client with service role key for test setup
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in environment');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create test user directly via API (for non-auth tests)
 */
export async function createTestUserDirect(
  email: string,
  password: string,
  name: string
) {
  const supabase = getSupabaseAdmin();

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: { name },
    });

  if (authError) throw authError;

  // Create user profile in database
  const response = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: authData.user.id,
      email,
      name,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create user profile');
  }

  return authData.user;
}

/**
 * Delete test user directly via API
 */
export async function deleteTestUserDirect(userId: string) {
  const supabase = getSupabaseAdmin();

  // Delete from database first (cascades to posts, images, etc.)
  await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'DELETE',
  });

  // Delete from auth
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

/**
 * Clean up all test users (emails matching pattern)
 */
export async function cleanupTestUsers(emailPattern = '@example.com') {
  const supabase = getSupabaseAdmin();

  // Get all users
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  // Delete users matching pattern
  for (const user of users) {
    if (user.email?.includes(emailPattern)) {
      await deleteTestUserDirect(user.id);
    }
  }
}
