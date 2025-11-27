import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private geminiApiKey: string;
  private useGemini: boolean;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.useGemini = !!this.geminiApiKey;

    if (this.useGemini) {
      this.logger.log('Gemini AI integration enabled');
    } else {
      this.logger.warn('Gemini API key not found - falling back to manual analysis');
    }
  }

  /**
   * Analyze review sentiment and extract keywords using Gemini or fallback method
   */
  async analyzeReview(reviewText: string): Promise<{
    sentiment: string;
    sentimentScore: number;
    keywords: string[];
    summary: string;
    method: 'gemini' | 'manual';
  }> {
    if (this.useGemini) {
      try {
        return await this.analyzeWithGemini(reviewText);
      } catch (error) {
        this.logger.error('Gemini API error, falling back to manual analysis:', error.message);
        return this.analyzeManual(reviewText);
      }
    }

    return this.analyzeManual(reviewText);
  }

  /**
   * Analyze sentiment using Google Gemini API
   */
  private async analyzeWithGemini(
    reviewText: string
  ): Promise<{
    sentiment: string;
    sentimentScore: number;
    keywords: string[];
    summary: string;
    method: 'gemini';
  }> {
    try {
      const prompt = `Analyze the following customer review and provide:
1. Overall sentiment (positive, negative, neutral)
2. Sentiment score (0-1, where 1 is most positive)
3. Top 3-5 keywords/themes
4. Brief summary (1 sentence)

Review: "${reviewText}"

Respond in JSON format:
{
  "sentiment": "positive/negative/neutral",
  "sentimentScore": 0.85,
  "keywords": ["cleanliness", "staff"],
  "summary": "..."
}`;

      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          params: {
            key: this.geminiApiKey,
          },
          timeout: 10000,
        }
      );

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonString = responseText;
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }

      const analysisResult = JSON.parse(jsonString);

      return {
        sentiment: analysisResult.sentiment || 'neutral',
        sentimentScore: parseFloat(analysisResult.sentimentScore) || 0.5,
        keywords: analysisResult.keywords || [],
        summary: analysisResult.summary || '',
        method: 'gemini',
      };
    } catch (error) {
      this.logger.error('Gemini analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback manual sentiment analysis with error handling
   */
  private analyzeManual(
    reviewText: string
  ): {
    sentiment: string;
    sentimentScore: number;
    keywords: string[];
    summary: string;
    method: 'manual';
  } {
    try {
      const text = reviewText.toLowerCase();

      // Sentiment scoring based on keywords
      const positiveKeywords = [
        'excellent',
        'excellent',
        'great',
        'good',
        'amazing',
        'wonderful',
        'fantastic',
        'love',
        'happy',
        'satisfied',
        'clean',
        'friendly',
        'fast',
        'professional',
        'efficient',
        'best',
        'perfect',
        'awesome',
        'pleasant',
        'delighted',
      ];

      const negativeKeywords = [
        'bad',
        'terrible',
        'awful',
        'horrible',
        'hate',
        'dirty',
        'rude',
        'slow',
        'worst',
        'disappointed',
        'poor',
        'unpleasant',
        'unhappy',
        'issue',
        'problem',
        'waste',
        'disgusting',
        'useless',
        'pathetic',
        'broken',
      ];

      let positiveCount = 0;
      let negativeCount = 0;

      positiveKeywords.forEach((keyword) => {
        if (text.includes(keyword)) positiveCount++;
      });

      negativeKeywords.forEach((keyword) => {
        if (text.includes(keyword)) negativeCount++;
      });

      const sentimentScore = positiveCount > 0 || negativeCount > 0 
        ? positiveCount / (positiveCount + negativeCount)
        : 0.5;

      let sentiment = 'neutral';
      if (sentimentScore > 0.6) {
        sentiment = 'positive';
      } else if (sentimentScore < 0.4) {
        sentiment = 'negative';
      }

      // Extract keywords (simple word extraction)
      const words = text.split(/\s+/).filter((word) => word.length > 4);
      const keywords = [...new Set(words)].slice(0, 5);

      return {
        sentiment,
        sentimentScore: parseFloat(sentimentScore.toFixed(2)),
        keywords,
        summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} review - ${reviewText.substring(0, 100)}...`,
        method: 'manual',
      };
    } catch (error) {
      this.logger.error('Manual analysis failed:', error.message);
      // Fallback to basic analysis
      return {
        sentiment: 'neutral',
        sentimentScore: 0.5,
        keywords: [],
        summary: reviewText.substring(0, 100) + '...',
        method: 'manual',
      };
    }
  }

  /**
   * Generate recommendations based on reviews
   */
  async generateRecommendations(
    reviews: Array<{ text: string; rating: number }>,
    stationName: string
  ): Promise<string[]> {
    if (this.useGemini) {
      try {
        return await this.generateWithGemini(reviews, stationName);
      } catch (error) {
        this.logger.error('Gemini recommendation error, using manual:', error.message);
        return this.generateManualRecommendations(reviews);
      }
    }

    return this.generateManualRecommendations(reviews);
  }

  private async generateWithGemini(
    reviews: Array<{ text: string; rating: number }>,
    stationName: string
  ): Promise<string[]> {
    const reviewSummary = reviews.map((r) => `Rating: ${r.rating}, Review: ${r.text}`).join('\n\n');

    const prompt = `Based on these customer reviews for "${stationName}", provide 3-5 specific actionable recommendations to improve customer satisfaction:

${reviewSummary}

Provide recommendations as a JSON array of strings:
["recommendation 1", "recommendation 2", ...]`;

    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          params: {
            key: this.geminiApiKey,
          },
          timeout: 10000,
        }
      );

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) return this.generateManualRecommendations(reviews);

      const jsonMatch = responseText.match(/\[([\s\S]*?)\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(`[${jsonMatch[1]}]`);
        return recommendations.slice(0, 5);
      }

      return this.generateManualRecommendations(reviews);
    } catch (error) {
      this.logger.error('Gemini recommendations failed:', error.message);
      throw error;
    }
  }

  private generateManualRecommendations(reviews: Array<{ text: string; rating: number }>): string[] {
    const recommendations: string[] = [];
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const allText = reviews.map((r) => r.text.toLowerCase()).join(' ');

    if (avgRating < 3) {
      recommendations.push('Improve overall service quality to increase customer satisfaction');
    }

    if (allText.includes('clean') || allText.includes('dirty')) {
      recommendations.push('Focus on cleanliness and maintenance standards');
    }

    if (allText.includes('wait') || allText.includes('slow')) {
      recommendations.push('Improve service speed and reduce wait times');
    }

    if (allText.includes('staff') || allText.includes('friendly')) {
      recommendations.push('Invest in staff training and customer service excellence');
    }

    if (allText.includes('facility') || allText.includes('equipment')) {
      recommendations.push('Maintain equipment and upgrade facilities');
    }

    return recommendations.length > 0 ? recommendations : ['Continue monitoring customer feedback for improvement opportunities'];
  }
}
