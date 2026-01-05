import { Controller, Get, Query, Param, ValidationPipe, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { QueryMetricsDto, QueryZoneMetricsDto } from './dto/query-metrics.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Controller for metrics API endpoints
 */
@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricsController {
    constructor(private metricsService: MetricsService) { }

    /**
     * GET /metrics?date=YYYY-MM-DD
     * Get all zone metrics for a specific date
     */
    @Get()
    async getMetrics(@Query(ValidationPipe) query: QueryMetricsDto) {
        if (!query.date) {
            throw new HttpException('Date parameter is required', HttpStatus.BAD_REQUEST);
        }

        const metrics = await this.metricsService.getMetricsByDate(query.date);

        if (metrics.length === 0) {
            throw new HttpException(
                `No metrics found for date: ${query.date}`,
                HttpStatus.NOT_FOUND,
            );
        }

        return {
            date: query.date,
            count: metrics.length,
            data: metrics,
        };
    }

    /**
     * GET /metrics/:zoneId?date=YYYY-MM-DD
     * Get metrics for a specific zone, optionally filtered by date
     */
    @Get(':zoneId')
    async getMetricsByZone(
        @Param('zoneId') zoneId: string,
        @Query(ValidationPipe) query: QueryZoneMetricsDto,
    ) {
        const metrics = await this.metricsService.getMetricsByZone(
            zoneId,
            query.date,
        );

        if (metrics.length === 0) {
            const message = query.date
                ? `No metrics found for zone "${zoneId}" on date ${query.date}`
                : `No metrics found for zone "${zoneId}"`;
            throw new HttpException(message, HttpStatus.NOT_FOUND);
        }

        return {
            zoneId,
            count: metrics.length,
            data: metrics,
        };
    }

    /**
     * GET /metrics/dates/available
     * Get all dates with available data
     */
    @Get('dates/available')
    async getAvailableDates() {
        const dates = await this.metricsService.getAvailableDates();

        return {
            count: dates.length,
            dates: dates.map((d) => d.toISOString().split('T')[0]),
        };
    }

    /**
     * GET /metrics/stats?date=YYYY-MM-DD
     * Get summary statistics for a date
     */
    @Get('stats/summary')
    async getStats(@Query(ValidationPipe) query: QueryMetricsDto) {
        if (!query.date) {
            throw new HttpException('Date parameter is required', HttpStatus.BAD_REQUEST);
        }

        const stats = await this.metricsService.getStatsByDate(query.date);

        if (!stats) {
            throw new HttpException(
                `No data found for date: ${query.date}`,
                HttpStatus.NOT_FOUND,
            );
        }

        return stats;
    }
}
