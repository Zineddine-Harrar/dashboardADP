import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/**
 * Metrics module
 * Provides API for querying cleaning metrics
 */
@Module({
    controllers: [MetricsController],
    providers: [MetricsService],
})
export class MetricsModule { }
