import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NluService {
  private readonly logger = new Logger(NluService.name);
  private openaiBaseUrl = 'https://api.openai.com/v1';

  constructor(private configService: ConfigService) {}

  /**
   * Perform sentiment analysis on review content
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    score: number;
  }> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with JSON containing:
              - sentiment: "positive", "neutral", or "negative"
              - confidence: 0 to 1
              - score: -1 (very negative) to 1 (very positive)`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        score: 0,
      };
    }
  }

  /**
   * Extract keywords from review content
   */
  async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Extract 3-5 key topics from the review text. Respond with a JSON array of keywords only.
              Example: ["fuel quality", "fast service", "cleanliness"]`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Keyword extraction error:', error);
      return [];
    }
  }

  /**
   * Classify review into category if not provided
   */
  async classifyCategory(
    text: string
  ): Promise<
    | 'fuel_quality'
    | 'service_quality'
    | 'cleanliness'
    | 'staff_behavior'
    | 'pricing'
    | 'facilities'
    | 'wait_time'
    | 'other'
  > {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Classify the review into one category. Respond with only the category name.
              Categories: fuel_quality, service_quality, cleanliness, staff_behavior, pricing, facilities, wait_time, other`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
        }
      );

      const category = response.data.choices[0].message.content.toLowerCase().trim();
      const validCategories = [
        'fuel_quality',
        'service_quality',
        'cleanliness',
        'staff_behavior',
        'pricing',
        'facilities',
        'wait_time',
        'other',
      ];
      return (validCategories.includes(category) ? category : 'other') as any;
    } catch (error) {
      this.logger.error('Category classification error:', error);
      return 'other';
    }
  }

  /**
   * Detect spam or fake reviews
   */
  async detectSpam(
    text: string
  ): Promise<{ isSpam: boolean; confidence: number; reasons: string[] }> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Detect if the review is spam, fake, or abusive. Respond with JSON:
              { "isSpam": boolean, "confidence": 0-1, "reasons": [...] }`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Spam detection error:', error);
      return { isSpam: false, confidence: 0, reasons: [] };
    }
  }

  /**
   * Translate text from Urdu to English
   */
  async translateUrduToEnglish(text: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'Translate the following Urdu text to English. Respond with only the translated text.',
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error('Translation error:', error);
      return text; // Return original if translation fails
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'Detect the language of the text. Respond with only the language code (e.g., "en", "ur", "ar").',
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
        }
      );

      return response.data.choices[0].message.content.toLowerCase().trim();
    } catch (error) {
      this.logger.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }
}
