/**
 * Deletes all E2E test data from the database.
 *
 * Usage:
 *   DATABASE_URL=<url> npx tsx apps/mockingbird/scripts/cleanup-e2e-data.ts
 *
 * Or from apps/mockingbird/:
 *   DATABASE_URL=<url> npx tsx scripts/cleanup-e2e-data.ts
 */

import { PrismaClient } from '../prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const E2E_USER_EMAILS = [
  'flock.owner@example.com',
  'flock.member@example.com',
  'testy.mctestface@example.com',
];

const E2E_GROUP_NAME_PREFIXES = ['E2E Public', 'E2E Private'];

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Starting E2E data cleanup…\n');

  // Delete groups whose names start with any E2E prefix
  const groupWhere = {
    OR: E2E_GROUP_NAME_PREFIXES.map((prefix) => ({
      name: { startsWith: prefix },
    })),
  };

  const groups = await prisma.group.findMany({ where: groupWhere, select: { id: true, name: true } });

  if (groups.length > 0) {
    console.log(`Found ${groups.length} E2E group(s):`);
    for (const g of groups) console.log(`  • ${g.name} (${g.id})`);

    const { count } = await prisma.group.deleteMany({ where: groupWhere });
    console.log(`✓ Deleted ${count} group(s)\n`);
  } else {
    console.log('No E2E groups found.\n');
  }

  // Delete E2E test users (cascade handles posts, memberships, etc.)
  const users = await prisma.user.findMany({
    where: { email: { in: E2E_USER_EMAILS } },
    select: { id: true, email: true },
  });

  if (users.length > 0) {
    console.log(`Found ${users.length} E2E user(s):`);
    for (const u of users) console.log(`  • ${u.email}`);

    for (const u of users) {
      // Delete cascade-blocked relations manually (same order as delete-user API route)
      await prisma.post.deleteMany({
        where: {
          responseToPostId: { not: null },
          responseTo: { posterId: u.id },
        },
      });
      await prisma.post.deleteMany({ where: { posterId: u.id } });
      await prisma.friends.deleteMany({
        where: { OR: [{ userId: u.id }, { friendId: u.id }] },
      });
      await prisma.session.deleteMany({ where: { userId: u.id } });
      await prisma.account.deleteMany({ where: { userId: u.id } });
      await prisma.userPermission.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
    console.log(`✓ Deleted ${users.length} user(s)\n`);
  } else {
    console.log('No E2E users found.\n');
  }

  console.log('✅ Cleanup complete.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
