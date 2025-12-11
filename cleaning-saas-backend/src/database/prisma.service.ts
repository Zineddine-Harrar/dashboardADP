import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma service for database operations
 * Extends PrismaClient and implements NestJS lifecycle hooks
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    /**
     * Connect to database when module initializes
     */
    async onModuleInit() {
        await this.$connect();
        console.log('✅ Database connected');
    }

    /**
     * Disconnect from database when module is destroyed
     */
    async onModuleDestroy() {
        await this.$disconnect();
        console.log('✅ Database disconnected');
    }

    /**
     * Clean all data from database (useful for testing)
     */
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot clean database in production');
        }

        await this.dailyZoneCleaningMetrics.deleteMany();
    }
}
