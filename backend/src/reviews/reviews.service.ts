import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus, ReviewCategory, SentimentType } from '../database/entities/review.entity';
import { CreateReviewDto, UpdateReviewStatusDto, ReviewFilterDto } from './dto/review.dto';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @Inject(forwardRef(() => CampaignsService))
    private campaignsService: CampaignsService
  ) {}

  async createReview(stationId: string, userId: string, createReviewDto: CreateReviewDto, phoneNumber?: string, customerName?: string) {
    const phoneForTracking = phoneNumber || createReviewDto.phoneNumber;
    
    // Check for 18-hour cooldown
    if (phoneForTracking) {
      const lastReview = await this.reviewsRepository.findOne({
        where: { phoneNumber: phoneForTracking },
        order: { createdAt: 'DESC' },
      });

      if (lastReview) {
        const hoursSinceLastReview = (Date.now() - lastReview.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReview < 18) {
          const hoursRemaining = (18 - hoursSinceLastReview).toFixed(1);
          throw new BadRequestException(
            `Please wait ${hoursRemaining} more hours before submitting another review. You can only submit one review every 18 hours.`
          );
        }
      }
    }

    const review = this.reviewsRepository.create({
      text: createReviewDto.content,
      rating: createReviewDto.rating,
      categories: createReviewDto.category ? [createReviewDto.category as ReviewCategory] : [],
      stationId,
      userId,
      phoneNumber: phoneNumber || createReviewDto.phoneNumber,
      customerName: customerName || createReviewDto.customerName,
      status: ReviewStatus.NEW,
      language: 'en',
      sentiment: null,
      sentimentScore: null,
      keywords: [],
      aiSummary: null,
      managerReply: null,
      managerReplyAt: null,
      flaggedAsSpam: false,
      flaggedForModeration: false,
      isVerified: false,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Track visit (phone number is now mandatory)
    if (phoneForTracking) {
      await this.campaignsService.trackVisit(phoneForTracking, stationId, savedReview.id);
      
      // Check if this review triggers a reward (e.g., 5th review)
      const rewardResult = await this.campaignsService.checkAndGenerateReward(
        phoneForTracking,
        savedReview.id,
        stationId
      );

      return {
        id: savedReview.id,
        text: savedReview.text,
        rating: savedReview.rating,
        status: savedReview.status,
        createdAt: savedReview.createdAt,
        reward: rewardResult ? {
          claimId: rewardResult.claim.id,
          qrCode: rewardResult.claim.qrCode,
          rewardType: rewardResult.campaign.rewardType,
          campaignName: rewardResult.campaign.name,
        } : null,
      };
      }

    // If no phone number (shouldn't happen with mandatory fields, but keeping for safety)
    return {
      id: savedReview.id,
      text: savedReview.text,
      rating: savedReview.rating,
      status: savedReview.status,
      createdAt: savedReview.createdAt,
    };
  }

  async getReviewsByStation(stationId: string, filter: ReviewFilterDto) {
    const query = this.reviewsRepository
      .createQueryBuilder('review')
      .where('review.stationId = :stationId', { stationId });

    if (filter.minRating) {
      query.andWhere('review.rating >= :minRating', { minRating: filter.minRating });
    }

    if (filter.maxRating) {
      query.andWhere('review.rating <= :maxRating', { maxRating: filter.maxRating });
    }

    if (filter.status) {
      query.andWhere('review.status = :status', { status: filter.status });
    }

    if (filter.category) {
      query.andWhere('review.category = :category', { category: filter.category });
    }

    if (filter.fromDate) {
      query.andWhere('review.createdAt >= :fromDate', { fromDate: new Date(filter.fromDate) });
    }

    if (filter.toDate) {
      query.andWhere('review.createdAt <= :toDate', { toDate: new Date(filter.toDate) });
    }

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await query
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(reviewId: string) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
      relations: ['media', 'user', 'station'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async updateReviewStatus(
    reviewId: string,
    updateDto: UpdateReviewStatusDto,
    respondedBy: string
  ) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewsRepository.update(reviewId, {
      status: updateDto.status,
      managerReply: updateDto.responseNote || review.managerReply,
      managerReplyAt: updateDto.responseNote ? new Date() : review.managerReplyAt,
      resolvedByUserId: updateDto.responseNote ? respondedBy : review.resolvedByUserId,
    });

    return { message: 'Review status updated successfully' };
  }

  async getReviewStats(stationId: string) {
    const reviews = await this.reviewsRepository.find({
      where: { stationId },
    });

    const total = reviews.length;
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    const ratingDistribution = {
      '5': reviews.filter((r) => r.rating === 5).length,
      '4': reviews.filter((r) => r.rating === 4).length,
      '3': reviews.filter((r) => r.rating === 3).length,
      '2': reviews.filter((r) => r.rating === 2).length,
      '1': reviews.filter((r) => r.rating === 1).length,
    };

    const statusDistribution = {
      [ReviewStatus.NEW]: reviews.filter((r) => r.status === ReviewStatus.NEW).length,
      [ReviewStatus.IN_REVIEW]: reviews.filter((r) => r.status === ReviewStatus.IN_REVIEW).length,
      [ReviewStatus.RESPONDED]: reviews.filter((r) => r.status === ReviewStatus.RESPONDED).length,
      [ReviewStatus.RESOLVED]: reviews.filter((r) => r.status === ReviewStatus.RESOLVED).length,
      [ReviewStatus.ARCHIVED]: reviews.filter((r) => r.status === ReviewStatus.ARCHIVED).length,
    };

    const sentimentDistribution = {
      [SentimentType.POSITIVE]: reviews.filter((r) => r.sentiment === SentimentType.POSITIVE).length,
      [SentimentType.NEUTRAL]: reviews.filter((r) => r.sentiment === SentimentType.NEUTRAL).length,
      [SentimentType.NEGATIVE]: reviews.filter((r) => r.sentiment === SentimentType.NEGATIVE).length,
    };

    return {
      total,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
      statusDistribution,
      sentimentDistribution,
    };
  }

  async deleteReview(reviewId: string) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewsRepository.delete(reviewId);

    return { message: 'Review deleted successfully' };
  }
}
