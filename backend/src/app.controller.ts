import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  getRoot() {
    return {
      message: 'Aramco Reviews API v1.0.0',
      endpoints: '/api/docs',
    };
  }
}
