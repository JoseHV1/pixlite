import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function makeRequest(ip: string) {
  return { ip } as never;
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello(makeRequest('1.1.1.1'))).toBe('Hello World!');
    });

    it('rate-limits a single IP after 30 requests within the window', () => {
      for (let i = 0; i < 30; i++) {
        appController.getHello(makeRequest('9.9.9.9'));
      }
      expect(() => appController.getHello(makeRequest('9.9.9.9'))).toThrow(HttpException);
    });

    it('tracks separate IPs independently', () => {
      for (let i = 0; i < 30; i++) {
        appController.getHello(makeRequest('8.8.8.8'));
      }
      expect(appController.getHello(makeRequest('7.7.7.7'))).toBe('Hello World!');
    });
  });
});
