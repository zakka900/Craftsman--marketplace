/**
 * Creates/updates the single ADMIN account from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD).
 * No public endpoint creates ADMIN accounts — only this script, run manually.
 * Usage: npm run prisma:seed-admin --workspace apps/backend
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running this script.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', emailVerified: true, passwordHash },
    create: {
      email, passwordHash, role: 'ADMIN', emailVerified: true,
      firstName: 'Admin', lastName: 'Artisan', country: 'AE'
    }
  });
  console.log(`Admin ready: ${admin.email} (id ${admin.id})`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
