import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', 1); // mirrors src/main.ts — see comment there
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/visit (POST) rate-limits per client IP, not per app instance', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < 20; i++) {
      await request(server)
        .post('/visit')
        .set('X-Forwarded-For', '203.0.113.50')
        .send({ site: 'pixlite' })
        .expect(201);
    }
    await request(server)
      .post('/visit')
      .set('X-Forwarded-For', '203.0.113.50')
      .send({ site: 'pixlite' })
      .expect(429);

    // A different client IP must not be blocked by the one above.
    await request(server)
      .post('/visit')
      .set('X-Forwarded-For', '203.0.113.51')
      .send({ site: 'pixlite' })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });
});
