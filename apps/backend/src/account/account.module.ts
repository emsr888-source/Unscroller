import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { User } from '../auth/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Entitlement } from '../subscription/entities/entitlement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subscription, Entitlement])],
  providers: [AccountService],
  controllers: [AccountController],
})
export class AccountModule {}
