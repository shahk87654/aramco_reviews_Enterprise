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

// Use postgres if all required env vars are set, otherwise use SQLite
const isPostgres = !!(
  process.env.DB_HOST &&
  process.env.DB_USERNAME &&
  process.env.DB_PASSWORD &&
  process.env.DB_NAME
);

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
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true',
      connectTimeoutMS: 5000,
      ...baseConfig,
    } as DataSourceOptions)
  : ({
      type: 'sqlite',
      database: process.env.DB_PATH || path.join(process.cwd(), 'aramco_reviews.sqlite'),
      ...baseConfig,
    } as DataSourceOptions);

export const AppDataSource = new DataSource(dataSourceConfig);
