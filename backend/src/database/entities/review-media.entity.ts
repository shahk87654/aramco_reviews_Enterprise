import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Review } from './review.entity';

@Entity('review_media')
export class ReviewMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reviewId: string;

  @ManyToOne(() => Review, (review) => review.media, { onDelete: 'CASCADE' })
  review: Review;

  @Column({ type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ type: 'varchar', length: 50 })
  fileType: string; // 'image', 'video', 'document'

  @Column({ type: 'varchar', length: 20 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'text', nullable: true })
  ocrText: string;

  @Column({ type: 'boolean', default: false })
  nsfw: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
