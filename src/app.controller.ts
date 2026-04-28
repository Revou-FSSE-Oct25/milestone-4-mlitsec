import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      message: 'RevoBank API is running',
      endpoints: {
        health: '/health',
        docs: '/api/docs',
      },
    };
  }
}
