/**
 * AI Service - OpenAI Integration (sanitized)
 * All network calls should proxy through the backend for security.
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
  suggestions?: string[];
}

class AIService {
  private apiKey: string | null = null;
  private readonly baseURL = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-4o-mini';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? null;
    if (!this.apiKey) {
      console.warn('[AIService] OPENAI_API_KEY not set. Falling back to offline responses.');
    }
  }

  async sendMessage(userMessage: string, history: Message[] = []): Promise<ChatResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: history.concat({ role: 'user', content: userMessage }),
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI error ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim() ?? '';
      return {
        text: text || 'I am here for you. Let me know what support you need.',
        suggestions: this.generateSuggestions(userMessage),
      };
    } catch (error) {
      console.error('[AIService] sendMessage failed', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private getFallbackResponse(userMessage: string): ChatResponse {
    const lower = userMessage.toLowerCase();
    if (lower.includes('streak') || lower.includes('win')) {
      return { text: 'Amazing work! Keep stacking those wins.', suggestions: ['Share with community'] };
    }
    if (lower.includes('urge') || lower.includes('scroll')) {
      return {
        text: 'Urges pass quickly. Take a deep breath and focus on why you started.',
        suggestions: ['Start focus session', 'Journal it out'],
      };
    }
    return {
      text: 'I am proud of the effort you are putting in. What would you like to focus on next?',
      suggestions: ['Plan next action', 'Track progress'],
    };
  }

  private generateSuggestions(userMessage: string): string[] {
    const lower = userMessage.toLowerCase();
    if (lower.includes('focus')) {
      return ['Launch 25-min session', 'Set today’s priority'];
    }
    if (lower.includes('tired')) {
      return ['Take a short break', 'Do a breathing exercise'];
    }
    return ['Keep chatting', 'Review goals'];
  }
}

export const aiService = new AIService();
export default aiService;
