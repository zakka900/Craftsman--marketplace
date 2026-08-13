/**
 * Crea/aggiorna l'unico account ADMIN da variabili d'ambiente (ADMIN_EMAIL, ADMIN_PASSWORD).
 * Nessun endpoint pubblico crea account ADMIN — solo questo script, eseguito manualmente.
 * Uso: npm run prisma:seed-admin --workspace apps/backend
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Imposta ADMIN_EMAIL e ADMIN_PASSWORD nell\'ambiente prima di eseguire questo script.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD deve avere almeno 8 caratteri.');
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
  console.log(`Admin pronto: ${admin.email} (id ${admin.id})`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
