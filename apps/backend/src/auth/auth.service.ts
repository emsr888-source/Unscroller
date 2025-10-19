import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreateUser(supabaseId: string, email: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { supabaseId } });

    if (!user) {
      user = this.userRepository.create({
        supabaseId,
        email,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findBySupabaseId(supabaseId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { supabaseId } });
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await this.userRepository.update(userId, { stripeCustomerId });
  }
}
