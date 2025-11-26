import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../database/entities/review.entity';
import { Station } from '../database/entities/station.entity';
import { Alert, AlertPriority, AlertStatus } from '../database/entities/alert.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
  ) {}

  async getGlobalStats() {
    const [totalReviews, activeStations, allReviews, allAlerts] = await Promise.all([
      this.reviewsRepository.count(),
      this.stationsRepository.count({ where: { isActive: true } }),
      this.reviewsRepository.find(),
      this.alertsRepository.find(),
    ]);

    const globalAverage =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    const negativeAlerts = allAlerts.filter(
      (a) => a.priority === AlertPriority.CRITICAL || a.priority === AlertPriority.HIGH
    ).length;

    // Get unique regions
    const stations = await this.stationsRepository.find({ where: { isActive: true } });
    const regions = [...new Set(stations.map((s) => s.city || 'Unknown'))];

    return {
      totalReviews,
      globalAverage: parseFloat(globalAverage.toFixed(2)),
      negativeAlerts,
      activeStations,
      topRegions: regions.slice(0, 3),
    };
  }

  async getStationLeaderboard(limit: number = 10) {
    const stations = await this.stationsRepository.find({
      where: { isActive: true },
      relations: ['reviews'],
    });

    const stationStats = stations.map((station) => {
      const reviews = station.reviews || [];
      const totalReviews = reviews.length;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      let status = 'good';
      if (avgRating >= 4.5) status = 'excellent';
      else if (avgRating < 3.5) status = 'needs-improvement';

      return {
        rank: 0, // Will be set after sorting
        name: station.name,
        region: station.city || 'Unknown',
        rating: parseFloat(avgRating.toFixed(2)),
        reviews: totalReviews,
        status,
      };
    });

    // Sort by rating descending, then by review count
    stationStats.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviews - a.reviews;
    });

    // Assign ranks
    stationStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    return stationStats.slice(0, limit);
  }

  async getReviewTrends(days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reviews = await this.reviewsRepository
      .createQueryBuilder('review')
      .where('review.createdAt >= :startDate', { startDate })
      .andWhere('review.createdAt <= :endDate', { endDate })
      .orderBy('review.createdAt', 'ASC')
      .getMany();

    // Group by week
    const weeklyData: Record<string, { reviews: number; ratings: number[] }> = {};

    reviews.forEach((review) => {
      const date = new Date(review.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = `Week ${Math.floor((endDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { reviews: 0, ratings: [] };
      }
      weeklyData[weekKey].reviews++;
      weeklyData[weekKey].ratings.push(review.rating);
    });

    return Object.entries(weeklyData).map(([date, data]) => ({
      date,
      reviews: data.reviews,
      avgRating: parseFloat(
        (data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length).toFixed(2)
      ),
    }));
  }

  async getRegionPerformance() {
    const stations = await this.stationsRepository.find({
      where: { isActive: true },
      relations: ['reviews'],
    });

    const regionMap: Record<
      string,
      { stations: number; reviews: number; ratings: number[] }
    > = {};

    stations.forEach((station) => {
      const region = station.city || 'Unknown';
      const reviews = station.reviews || [];

      if (!regionMap[region]) {
        regionMap[region] = { stations: 0, reviews: 0, ratings: [] };
      }

      regionMap[region].stations++;
      regionMap[region].reviews += reviews.length;
      reviews.forEach((r) => regionMap[region].ratings.push(r.rating));
    });

    return Object.entries(regionMap).map(([region, data]) => ({
      region,
      avgRating: parseFloat(
        (data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length || 0).toFixed(2)
      ),
      stations: data.stations,
      reviews: data.reviews,
    }));
  }

  async getCategoryPerformance() {
    const reviews = await this.reviewsRepository.find();

    const categoryMap: Record<string, number[]> = {};

    reviews.forEach((review) => {
      if (review.categories && review.categories.length > 0) {
        review.categories.forEach((category) => {
          if (!categoryMap[category]) {
            categoryMap[category] = [];
          }
          categoryMap[category].push(review.rating);
        });
      }
    });

    return Object.entries(categoryMap).map(([category, ratings]) => ({
      category: category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      avgRating: parseFloat(
        (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
      ),
      trend: 'stable', // Could be calculated based on historical data
    }));
  }
}

