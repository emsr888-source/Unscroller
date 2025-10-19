import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async trackEvent(userId: string | undefined, eventType: string, metadata?: any): Promise<Event> {
    const event = this.eventRepository.create({
      userId,
      eventType,
      metadata,
    });

    return this.eventRepository.save(event);
  }
}
