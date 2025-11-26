import amqp from 'amqplib';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

type Sentiment = 'positive' | 'neutral' | 'negative';

interface ReviewMessage {
  reviewId: string;
  stationId: string;
  text: string;
  language: string;
  rating: number;
  userId: string;
}

interface AlertMessage {
  alertId: string;
  stationId: string;
  reviewId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  managerEmail: string;
}

interface SummaryMessage {
  stationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

class ReviewWorker {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
  private openaiApiKey = process.env.OPENAI_API_KEY;

  async connect(): Promise<void> {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
      this.connection = connection;
      const channel = await connection.createChannel();
      this.channel = channel;
      console.log('✅ Connected to RabbitMQ');

      // Declare queues
      await channel.assertQueue('reviews.nlu', { durable: true });
      await channel.assertQueue('reviews.summary', { durable: true });
      await channel.assertQueue('alerts.process', { durable: true });

      this.startConsumers();
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private startConsumers(): void {
    if (!this.channel) return;

    // NLU Worker - sentiment analysis, translation, keywords
    this.channel.consume('reviews.nlu', async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      const review: ReviewMessage = JSON.parse(msg.content.toString());
      console.log('🔄 Processing review NLU:', review.reviewId);

      try {
        // Detect language if not provided
        let language = review.language;
        if (!language || language === 'auto') {
          language = await this.detectLanguage(review.text);
        }

        // Translate if Urdu
        let text = review.text;
        if (language === 'ur') {
          console.log('Translating Urdu to English...');
          text = await this.translateUrduToEnglish(review.text);
        }

        // Sentiment analysis
        const sentimentResult = await this.analyzeSentiment(text);

        // Keyword extraction
        const keywords = await this.extractKeywords(text);

        // Category classification
        const category = await this.classifyCategory(text);

        // Spam detection
        const spamResult = await this.detectSpam(text);

        // Update review with NLU results
        await axios.patch(
          `${this.apiBaseUrl}/stations/${review.stationId}/reviews/${review.reviewId}`,
          {
            sentiment: sentimentResult.sentiment,
            keywords,
            category,
            isSpam: spamResult.isSpam,
            language: language === 'ur' ? 'en' : language,
          },
          {
            headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
          },
        );

        console.log('✅ Review NLU complete:', review.reviewId);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('❌ Error processing review:', error);
        this.channel?.nack(msg, false, true);
      }
    });

    // Summary Worker - generate AI summaries
    this.channel.consume('reviews.summary', async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      const payload: SummaryMessage = JSON.parse(msg.content.toString());
      console.log('🔄 Generating summary for station:', payload.stationId);

      try {
        // Fetch reviews for the period
        const reviewsRes = await axios.get(
          `${this.apiBaseUrl}/stations/${payload.stationId}/reviews?fromDate=${payload.startDate}&toDate=${payload.endDate}&limit=100`,
          {
            headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
          },
        );

        const reviews = reviewsRes.data.data;

        if (reviews.length === 0) {
          console.log('No reviews found for period');
          this.channel?.ack(msg);
          return;
        }

        // Aggregate sentiment and keywords
        const sentimentCounts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
        const topKeywords: Record<string, number> = {};
        const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

        reviews.forEach((review: any) => {
          const sentiment = review.sentiment as Sentiment | undefined;
          if (sentiment && sentimentCounts[sentiment] !== undefined) {
            sentimentCounts[sentiment]++;
          }
          if (review.keywords) {
            review.keywords.forEach((kw: string) => {
              topKeywords[kw] = (topKeywords[kw] || 0) + 1;
            });
          }
        });

        // Generate summary using LLM
        const summaryText = await this.generateStationSummary({
          totalReviews: reviews.length,
          avgRating,
          sentimentCounts,
          topKeywords: Object.entries(topKeywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([kw]) => kw),
          recentReviews: reviews.slice(0, 5),
        });

        // Store in StationsScorecard
        await axios.post(
          `${this.apiBaseUrl}/stations/${payload.stationId}/scorecard`,
          {
            period: payload.period,
            startDate: payload.startDate,
            endDate: payload.endDate,
            totalReviews: reviews.length,
            averageRating: parseFloat(avgRating.toFixed(2)),
            summaryText,
            sentimentDistribution: sentimentCounts,
            generatedAt: new Date(),
          },
          {
            headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
          },
        );

        console.log('✅ Summary generation complete:', payload.stationId);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('❌ Error generating summary:', error);
        this.channel?.nack(msg, false, true);
      }
    });

    // Alert Processing Worker
    this.channel.consume('alerts.process', async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      const alertData: AlertMessage = JSON.parse(msg.content.toString());
      console.log('🔄 Processing alert:', alertData.alertId);

      try {
        // Fetch alert and review details
        const reviewRes = await axios.get(
          `${this.apiBaseUrl}/stations/${alertData.stationId}/reviews/${alertData.reviewId}`,
          {
            headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
          },
        );

        const review = reviewRes.data;

        // Send email notification to manager
        await this.sendEmailNotification(alertData.managerEmail, {
          subject: `⚠️ Alert: ${alertData.reason}`,
          stationId: alertData.stationId,
          reviewTitle: review.title,
          reviewRating: review.rating,
          reviewContent: review.content,
          priority: alertData.priority,
        });

        // Send SMS for critical alerts
        if (alertData.priority === 'critical') {
          await this.sendSmsNotification(alertData.managerEmail, `CRITICAL ALERT: ${alertData.reason}`);
        }

        // Update alert status
        await axios.patch(
          `${this.apiBaseUrl}/stations/${alertData.stationId}/alerts/${alertData.alertId}/acknowledge`,
          {},
          {
            headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
          },
        );

        console.log('✅ Alert notification sent:', alertData.alertId);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('❌ Error processing alert:', error);
        this.channel?.nack(msg, false, true);
      }
    });
  }

  private async analyzeSentiment(text: string): Promise<{ sentiment: 'positive' | 'neutral' | 'negative'; confidence: number }> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Analyze sentiment. Respond with JSON: {"sentiment": "positive"|"neutral"|"negative", "confidence": 0-1}',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Extract 3-5 keywords. Respond with JSON array only. Example: ["fuel quality", "service"]',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return [];
    }
  }

  private async classifyCategory(text: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Classify into one: fuel_quality, service_quality, cleanliness, staff_behavior, pricing, facilities, wait_time, or other',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      return response.data.choices[0].message.content.toLowerCase().trim();
    } catch (error) {
      console.error('Category classification error:', error);
      return 'other';
    }
  }

  private async detectSpam(text: string): Promise<{ isSpam: boolean; confidence: number }> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Detect spam/fake. Respond with JSON: {"isSpam": boolean, "confidence": 0-1}',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Spam detection error:', error);
      return { isSpam: false, confidence: 0 };
    }
  }

  private async translateUrduToEnglish(text: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Translate Urdu to English. Respond with translated text only.',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  private async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Detect language code only. Example: en, ur, ar',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.1,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      return response.data.choices[0].message.content.toLowerCase().trim();
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  private async generateStationSummary(data: any): Promise<string> {
    try {
      const prompt = `
Generate a brief station performance summary based on:
- Total Reviews: ${data.totalReviews}
- Average Rating: ${data.avgRating}/5
- Sentiment: ${data.sentimentCounts.positive} positive, ${data.sentimentCounts.neutral} neutral, ${data.sentimentCounts.negative} negative
- Top Topics: ${data.topKeywords.join(', ')}

Provide actionable insights for the station manager in 3-4 sentences.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a customer feedback analyst. Provide actionable insights.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        },
        {
          headers: { 'Authorization': `Bearer ${this.openaiApiKey}` },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  private async sendEmailNotification(to: string, data: any): Promise<void> {
    try {
      // TODO: Integrate with SendGrid or your email provider
      console.log(`📧 Email to ${to}: ${data.subject}`);
      // Example:
      // await sgMail.send({
      //   to,
      //   from: process.env.EMAIL_FROM,
      //   subject: data.subject,
      //   html: `<h2>${data.subject}</h2><p>Review: ${data.reviewTitle}</p><p>Rating: ${data.reviewRating}/5</p>`,
      // });
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  private async sendSmsNotification(to: string, message: string): Promise<void> {
    try {
      // TODO: Integrate with Twilio or your SMS provider
      console.log(`📱 SMS to ${to}: ${message}`);
      // Example:
      // await twilioClient.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE,
      //   to,
      // });
    } catch (error) {
      console.error('SMS notification error:', error);
    }
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    console.log('Connection closed');
  }
}

// Main
const worker = new ReviewWorker();

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await worker.close();
  process.exit(0);
});

worker.connect().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

