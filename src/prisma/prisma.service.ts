import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function validateDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not defined. Set the DATABASE_URL variable in Railway.'
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    databaseUrl.includes('localhost')
  ) {
    throw new Error(
      'DATABASE_URL is set to localhost in production. Update Railway DATABASE_URL to the production database URL.'
    );
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    validateDatabaseUrl();
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}