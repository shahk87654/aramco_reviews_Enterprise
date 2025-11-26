import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import {
  Station,
  User,
  Review,
  ReviewMedia,
  Alert,
  StationsScorecard,
  AuditLog,
  AlertConfiguration,
} from './entities';

const isPostgres = process.env.DB_TYPE === 'postgres';

const baseConfig: Partial<DataSourceOptions> = {
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Station,
    User,
    Review,
    ReviewMedia,
    Alert,
    StationsScorecard,
    AuditLog,
    AlertConfiguration,
  ],
  migrations: [path.join(__dirname, 'migrations', '*.ts')],
  subscribers: [],
};

const dataSourceConfig: DataSourceOptions = isPostgres
  ? ({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'aramco_reviews',
      ssl: process.env.DB_SSL === 'true',
      ...baseConfig,
    } as DataSourceOptions)
  : ({
      type: 'sqlite',
      database: process.env.DB_PATH || path.join(process.cwd(), 'aramco_reviews.sqlite'),
      ...baseConfig,
    } as DataSourceOptions);

export const AppDataSource = new DataSource(dataSourceConfig);
