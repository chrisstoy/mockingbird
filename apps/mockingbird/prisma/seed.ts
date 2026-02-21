// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg');

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('SEED_ADMIN_EMAIL env var is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query(
      `UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = $1 RETURNING id, name, email`,
      [adminEmail]
    );

    if (rows.length === 0) {
      console.error(`No user found with email: ${adminEmail}`);
      process.exit(1);
    }

    console.log(`Set ${rows[0].email} (${rows[0].id}) to SUPER_ADMIN`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
