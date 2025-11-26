import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertPriority, AlertStatus, AlertType } from '../database/entities/alert.entity';
import { AlertConfiguration } from '../database/entities/alert-configuration.entity';
import { Review, SentimentType } from '../database/entities/review.entity';
import { Station } from '../database/entities/station.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    @InjectRepository(AlertConfiguration)
    private configRepository: Repository<AlertConfiguration>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
    private configService: ConfigService
  ) {}

  /**
   * Check if alert should be triggered based on rules
   */
  async checkAndCreateAlert(reviewId: string): Promise<Alert | null> {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) return null;

    const config = await this.configRepository.findOne({
      where: { stationId: review.stationId },
    });

    if (!config || !config.isEnabled) return null;

    // Check negative rating threshold
    if (review.rating <= config.negativeRatingThreshold) {
      const priority =
        review.rating === 1
          ? AlertPriority.CRITICAL
          : review.rating === 2
          ? AlertPriority.HIGH
          : AlertPriority.MEDIUM;
      const alert = this.alertsRepository.create({
        stationId: review.stationId,
        reviewId,
        type: AlertType.NEGATIVE_RATING,
        priority,
        reason: `Low rating (${review.rating}/5) review submitted`,
        status: AlertStatus.NEW,
        payload: JSON.stringify({ rating: review.rating }),
      });

      const savedAlert = await this.alertsRepository.save(alert);

      await this.triggerNotification(savedAlert, review);

      return savedAlert;
    }

    // Check for negative sentiment
    if (config.sentimentBasedAlerts && review.sentiment === SentimentType.NEGATIVE) {
      const alert = this.alertsRepository.create({
        stationId: review.stationId,
        reviewId,
        type: AlertType.NEGATIVE_SENTIMENT,
        priority: AlertPriority.MEDIUM,
        reason: 'Negative sentiment detected in review',
        status: AlertStatus.NEW,
        payload: JSON.stringify({ sentimentScore: review.sentimentScore }),
      });

      const savedAlert = await this.alertsRepository.save(alert);
      await this.triggerNotification(savedAlert, review);
      return savedAlert;
    }

    // Check spam alerts
    if (config.spamDetectionAlerts && review.flaggedAsSpam) {
      const alert = this.alertsRepository.create({
        stationId: review.stationId,
        reviewId,
        type: AlertType.SPAM_DETECTED,
        priority: AlertPriority.LOW,
        reason: 'Spam/fake review detected',
        status: AlertStatus.NEW,
      });

      const savedAlert = await this.alertsRepository.save(alert);
      await this.triggerNotification(savedAlert, review);
      return savedAlert;
    }

    return null;
  }

  /**
   * Trigger notification to manager
   */
  private async triggerNotification(alert: Alert, review: Review): Promise<void> {
    const station = await this.stationsRepository.findOne({
      where: { id: alert.stationId },
      relations: ['manager'],
    });

    if (!station || !station.manager) return;

    // TODO: Send email notification
    this.logger.debug(
      `Sending alert notification for review ${review.id} (rating: ${review.rating}) to ${station.manager.email}`
    );

    // TODO: Send SMS notification if enabled
    // TODO: Push notification to mobile app
    // TODO: Dashboard notification
  }

  /**
   * Get alerts for a station
   */
  async getAlerts(stationId: string, status?: AlertStatus, priority?: AlertPriority) {
    const query = this.alertsRepository
      .createQueryBuilder('alert')
      .where('alert.stationId = :stationId', { stationId });

    if (status) {
      query.andWhere('alert.status = :status', { status });
    }

    if (priority) {
      query.andWhere('alert.priority = :priority', { priority });
    }

    const alerts = await query.orderBy('alert.createdAt', 'DESC').getMany();

    return alerts;
  }

  /**
   * Acknowledge alert (manager action)
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await this.alertsRepository.update(alertId, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    });
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolutionNote: string): Promise<void> {
    await this.alertsRepository.update(alertId, {
      status: AlertStatus.RESOLVED,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNote,
    });
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(stationId: string) {
    const alerts = await this.alertsRepository.find({
      where: { stationId },
    });

    const stats = {
      total: alerts.length,
      byStatus: {
        [AlertStatus.NEW]: alerts.filter((a) => a.status === AlertStatus.NEW).length,
        [AlertStatus.ACKNOWLEDGED]: alerts.filter((a) => a.status === AlertStatus.ACKNOWLEDGED).length,
        [AlertStatus.RESOLVED]: alerts.filter((a) => a.status === AlertStatus.RESOLVED).length,
        [AlertStatus.ESCALATED]: alerts.filter((a) => a.status === AlertStatus.ESCALATED).length,
      },
      byPriority: {
        [AlertPriority.CRITICAL]: alerts.filter((a) => a.priority === AlertPriority.CRITICAL).length,
        [AlertPriority.HIGH]: alerts.filter((a) => a.priority === AlertPriority.HIGH).length,
        [AlertPriority.MEDIUM]: alerts.filter((a) => a.priority === AlertPriority.MEDIUM).length,
        [AlertPriority.LOW]: alerts.filter((a) => a.priority === AlertPriority.LOW).length,
      },
      avgResolutionTime: this.calculateAvgResolutionTime(alerts),
    };

    return stats;
  }

  private calculateAvgResolutionTime(alerts: Alert[]): number {
    const resolved = alerts.filter((a) => a.resolvedAt);
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, alert) => {
      const createdTime = new Date(alert.createdAt).getTime();
      const resolvedTime = new Date(alert.resolvedAt!).getTime();
      return sum + (resolvedTime - createdTime);
    }, 0);

    return Math.round(totalTime / resolved.length / (1000 * 60)); // Convert to minutes
  }

  /**
   * Update alert configuration for a station
   */
  async updateAlertConfig(
    stationId: string,
    config: Partial<AlertConfiguration>
  ): Promise<AlertConfiguration> {
    let alertConfig = await this.configRepository.findOne({
      where: { stationId },
    });

    if (!alertConfig) {
      alertConfig = this.configRepository.create({
        stationId,
        name: config.name || `${stationId}-alert-config`,
        ...config,
        criticalKeywords: config.criticalKeywords ?? [],
      });
    } else {
      Object.assign(alertConfig, config);
    }

    return this.configRepository.save(alertConfig);
  }
}
