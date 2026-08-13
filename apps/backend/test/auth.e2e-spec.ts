import { Test } from '@nestjs/testing';
import { Global, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { AuthModule } from '../src/modules/auth.module';
import { PrismaService } from '../src/prisma.service';

/**
 * Prisma finto in memoria: isola il test e2e dal database reale (Supabase in
 * produzione). Copre solo i metodi usati da AuthService — non un mock generico.
 */
class FakePrismaService {
  private users = new Map<string, any>();
  private otps: any[] = [];
  private seq = 0;

  user = {
    findUnique: async ({ where }: any) => {
      if (where.email) return [...this.users.values()].find((u) => u.email === where.email) ?? null;
      if (where.id) return this.users.get(where.id) ?? null;
      return null;
    },
    create: async ({ data }: any) => {
      const id = `user_${++this.seq}`;
      const user = { id, emailVerified: false, ...data };
      this.users.set(id, user);
      return user;
    },
    update: async ({ where, data }: any) => {
      const user = { ...this.users.get(where.id), ...data };
      this.users.set(where.id, user);
      return user;
    }
  };

  otpCode = {
    deleteMany: async () => ({ count: 0 }),
    create: async ({ data }: any) => {
      const otp = { id: `otp_${++this.seq}`, usedAt: null, createdAt: new Date(), ...data };
      this.otps.push(otp);
      return otp;
    },
    findFirst: async ({ where }: any) => {
      return (
        this.otps
          .filter((o) => o.userId === where.userId && o.purpose === where.purpose && o.usedAt === null && o.codeHash === where.codeHash)
          .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
      );
    },
    update: async ({ where, data }: any) => {
      const otp = this.otps.find((o) => o.id === where.id);
      Object.assign(otp, data);
      return otp;
    }
  };
}

// AuthModule si aspetta PrismaService dallo scope globale (in produzione lo fornisce
// AppModule, marcato @Global()) — qui lo replichiamo con un fake per non toccare il DB reale.
@Global()
@Module({
  providers: [{ provide: PrismaService, useClass: FakePrismaService }],
  exports: [PrismaService]
})
class FakePrismaModule {}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'testpass123';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.OTP_DEV_CODE = '123456';
    process.env.NODE_ENV = 'test';

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), FakePrismaModule, AuthModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new account', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ firstName: 'E2E', lastName: 'Test', email, password, country: 'AE' })
      .expect(201);
  });

  it('refuses login before the email is verified', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(403);
  });

  it('verifies with the OTP dev code and returns a JWT without the password hash', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ email, code: '123456' })
      .expect(201);

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('logs in once verified', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('returns a clean 409 (not a raw 500) when re-registering a verified email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ firstName: 'Dup', lastName: 'User', email, password, country: 'AE' })
      .expect(409);
  });
});
