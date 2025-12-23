import { Controller, Delete, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountService } from './account.service';
import { User } from '../auth/entities/user.entity';

type AuthenticatedRequest = Request & { user: User };

@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.accountService.deleteAccount(req.user);
  }
}
