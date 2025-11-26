import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewStatusDto, ReviewFilterDto } from './dto/review.dto';

@ApiTags('reviews')
@Controller('stations/:stationId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new review for a station' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createReview(
    @Param('stationId') stationId: string,
    @Request() req: any,
    @Body() createReviewDto: CreateReviewDto & { phoneNumber?: string; customerName?: string }
  ) {
    const userId = req.user.sub || req.user.userId || req.user.id;
    return this.reviewsService.createReview(
      stationId, 
      userId, 
      createReviewDto, 
      createReviewDto.phoneNumber,
      createReviewDto.customerName
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews for a station with filtering' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getReviews(@Param('stationId') stationId: string, @Query() filter: ReviewFilterDto) {
    return this.reviewsService.getReviewsByStation(stationId, filter);
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get a specific review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReview(@Param('stationId') stationId: string, @Param('reviewId') reviewId: string) {
    return this.reviewsService.getReviewById(reviewId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':reviewId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review status (for managers)' })
  @ApiResponse({ status: 200, description: 'Review status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateStatus(
    @Param('stationId') stationId: string,
    @Param('reviewId') reviewId: string,
    @Body() updateDto: UpdateReviewStatusDto,
    @Request() req: any
  ) {
    const userId = req.user.sub || req.user.userId || req.user.id;
    return this.reviewsService.updateReviewStatus(reviewId, updateDto, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics for a station' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Param('stationId') stationId: string) {
    return this.reviewsService.getReviewStats(stationId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':reviewId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (admin only)' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @Param('stationId') stationId: string,
    @Param('reviewId') reviewId: string,
    @Request() req: any
  ) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.reviewsService.deleteReview(reviewId);
  }
}
