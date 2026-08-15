import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be defined in server/.env for Prisma config');
}

export const adapters = {
  pg: new PrismaPg(process.env.DATABASE_URL)
};

const config = {
  schema: path.resolve(__dirname, './schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL
  }
};

export default config;
