import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' }, // Log all queries
        { emit: 'stdout', level: 'error' }, // Log errors to console
        { emit: 'stdout', level: 'warn' },  // Log warnings to console
      ],
    });
  }

  async onModuleInit() {
    await this.$connect(); // Connect to database when module initializes
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close(); // Close app gracefully on Prisma shutdown
    });
  }

  // Optional: Add custom methods for complex queries
  async clearDatabase() {
    if (process.env.NODE_ENV === 'test') {
      // Add deletion logic for all models
      await this.user.deleteMany();
      // Add other models as needed
    }
  }
}