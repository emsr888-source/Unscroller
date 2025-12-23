import { Controller, Get, UseGuards, Req, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    this.logger.debug(`GET /api/auth/me requested for user ${req.user?.id ?? 'unknown'}`);
    return req.user;
  }
}
