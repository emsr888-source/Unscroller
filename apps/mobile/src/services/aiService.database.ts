/**
 * AI Service (DB-backed) -- sanitized version that only reads API key from env
 * All requests should ideally proxy through a secure backend.
 */

import OpenAI from 'openai';
import { supabase } from './supabase';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  usedFallback: boolean;
  conversationId: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? null;

class AIServiceDB {
  private openai: OpenAI | null = null;

  constructor() {
    if (OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        console.log('[AIServiceDB] OpenAI client initialized');
      } catch (error) {
        console.error('[AIServiceDB] Failed to init OpenAI', error);
        this.openai = null;
      }
    } else {
      console.warn('[AIServiceDB] OPENAI_API_KEY not set; using fallback responses.');
    }
  }

  private get supabaseClient() {
    if (!supabase) {
      throw new Error('Supabase client unavailable');
    }
    return supabase;
  }

  private async getOrCreateConversation(userId: string): Promise<string> {
    const db = this.supabaseClient;
    const { data } = await db
      .from('ai_conversations')
      .select('id')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();

    if (data) return data.id;

    const { data: inserted, error } = await db
      .from('ai_conversations')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (error || !inserted) {
      throw new Error('Failed to create AI conversation');
    }
    return inserted.id;
  }

  private async loadHistory(conversationId: string): Promise<Message[]> {
    const db = this.supabaseClient;
    const { data } = await db
      .from('ai_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    return (data ?? []).map(row => ({
      role: row.role as Message['role'],
      content: row.content,
      timestamp: new Date(row.created_at),
    }));
  }

  private async saveMessage(conversationId: string, role: Message['role'], content: string) {
    const db = this.supabaseClient;
    await db.from('ai_messages').insert({ conversation_id: conversationId, role, content });
    await db
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  async sendMessage(userId: string, userMessage: string): Promise<ChatResponse> {
    const conversationId = await this.getOrCreateConversation(userId);
    const history = await this.loadHistory(conversationId);
    await this.saveMessage(conversationId, 'user', userMessage);

    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: this.systemPrompt() },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: userMessage },
          ],
          max_tokens: 400,
          temperature: 0.7,
        });

        const assistantMessage = completion.choices[0]?.message?.content?.trim();
        if (assistantMessage) {
          await this.saveMessage(conversationId, 'assistant', assistantMessage);
          return { message: assistantMessage, usedFallback: false, conversationId };
        }
      } catch (error) {
        console.error('[AIServiceDB] OpenAI request failed', error);
      }
    }

    const fallback = this.getFallbackResponse(userMessage, history);
    await this.saveMessage(conversationId, 'assistant', fallback);
    return { message: fallback, usedFallback: true, conversationId };
  }

  private getFallbackResponse(userMessage: string, history: Message[]): string {
    const lower = userMessage.toLowerCase();
    if (lower.includes('streak')) {
      return 'That streak is precious—protect it like gold. What helped you reach this point?';
    }
    if (lower.includes('urge') || lower.includes('scroll')) {
      return 'Urges fade when you act. Try a 3-deep-breath reset and text me how it felt.';
    }
    if (history.length > 0) {
      return 'I’m still here with you. What’s the next small step you can take right now?';
    }
    return 'You’re not alone. Tell me what you’re working toward and we’ll get after it.';
  }

  private systemPrompt() {
    return (
      'You are an empathetic accountability buddy for Unscroller, focused on breaking social media habits. ' +
      'Keep responses short, warm, and action-oriented.'
    );
  }
}

export const aiServiceDB = new AIServiceDB();
export default aiServiceDB;
