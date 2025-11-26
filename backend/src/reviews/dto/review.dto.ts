import { IsString, IsNumber, IsOptional, Min, Max, IsArray, IsEnum, Length, Matches } from 'class-validator';
import { ReviewStatus } from '../../database/entities/review.entity';

export class CreateReviewDto {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 2000)
  content: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  category?:
    | 'fuel_quality'
    | 'service_quality'
    | 'cleanliness'
    | 'staff_behavior'
    | 'pricing'
    | 'facilities'
    | 'other'
    | 'wait_time';

  @IsOptional()
  @IsString()
  visitDate?: string;


  @IsString()
  @Length(1, 255)
  customerName: string;

  @IsString()
  @Matches(/^\d{9,13}$/, { message: 'Phone number must be 9 to 13 digits long' })
  phoneNumber: string;
}

export class UpdateReviewStatusDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  responseNote?: string;
}

export class ReviewFilterDto {
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @IsNumber()
  maxRating?: number;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
