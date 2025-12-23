import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Entitlement } from '../subscription/entities/entitlement.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Entitlement])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
