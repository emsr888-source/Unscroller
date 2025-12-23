import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ============ JOURNAL ============

  @Get('journal')
  async getJournalEntries(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.getJournalEntries(userId, limit ? parseInt(limit) : 30);
  }

  @Get('journal/:date')
  async getJournalEntry(
    @Headers('authorization') auth: string,
    @Param('date') date: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.getJournalEntry(userId, date);
  }

  @Post('journal')
  async createJournalEntry(
    @Headers('authorization') auth: string,
    @Body() entryData: {
      entry_date: string;
      mood?: string;
      content: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.createJournalEntry(userId, entryData);
  }

  @Put('journal/:date')
  async updateJournalEntry(
    @Headers('authorization') auth: string,
    @Param('date') date: string,
    @Body() updates: {
      mood?: string;
      content?: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.updateJournalEntry(userId, date, updates);
  }

  // ============ TODOS ============

  @Get('todos')
  async getTodos(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.contentService.getTodos(userId);
  }

  @Post('todos')
  async createTodo(
    @Headers('authorization') auth: string,
    @Body() todoData: {
      text: string;
      category?: string;
      priority?: number;
      due_date?: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.createTodo(userId, todoData);
  }

  @Put('todos/:id')
  async updateTodo(
    @Headers('authorization') auth: string,
    @Param('id') todoId: string,
    @Body() updates: {
      text?: string;
      completed?: boolean;
      category?: string;
      priority?: number;
      due_date?: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.updateTodo(userId, todoId, updates);
  }

  @Delete('todos/:id')
  async deleteTodo(
    @Headers('authorization') auth: string,
    @Param('id') todoId: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.deleteTodo(userId, todoId);
  }

  // ============ RESOURCES ============

  @Get('resources')
  async getResources(@Query('category') category?: string) {
    return this.contentService.getResources(category);
  }

  @Get('resources/:id')
  async getResource(@Param('id') resourceId: string) {
    return this.contentService.getResource(resourceId);
  }

  @Get('resources/progress/user')
  async getUserResourceProgress(@Headers('authorization') auth: string) {
    const userId = this.extractUserId(auth);
    return this.contentService.getUserResourceProgress(userId);
  }

  @Post('resources/:id/progress')
  async updateResourceProgress(
    @Headers('authorization') auth: string,
    @Param('id') resourceId: string,
    @Body() progress: {
      completed?: boolean;
      progress_percentage?: number;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.updateResourceProgress(userId, resourceId, progress);
  }

  // ============ MEDITATION ============

  @Get('meditation/sessions')
  async getMeditationSessions(
    @Headers('authorization') auth: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.getMeditationSessions(userId, limit ? parseInt(limit) : 50);
  }

  @Post('meditation/sessions')
  async logMeditationSession(
    @Headers('authorization') auth: string,
    @Body() sessionData: {
      exercise_type: string;
      duration_minutes: number;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.logMeditationSession(userId, sessionData);
  }

  // ============ CALENDAR ============

  @Get('calendar')
  async getCalendarEvents(
    @Headers('authorization') auth: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.getCalendarEvents(userId, startDate, endDate);
  }

  @Post('calendar')
  async createCalendarEvent(
    @Headers('authorization') auth: string,
    @Body() eventData: {
      event_date: string;
      event_type: string;
      title: string;
      description?: string;
      icon?: string;
    },
  ) {
    const userId = this.extractUserId(auth);
    return this.contentService.createCalendarEvent(userId, eventData);
  }

  private extractUserId(auth: string): string {
    return auth?.replace('Bearer ', '') || 'anonymous';
  }
}
