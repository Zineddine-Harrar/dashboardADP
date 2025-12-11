import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DailyZoneCleaningMetrics } from '@prisma/client';

/**
 * Service for querying metrics from the database
 */
@Injectable()
export class MetricsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all metrics for a specific date
     * @param date - Date to query (YYYY-MM-DD)
     * @returns Array of metrics for all zones on that date
     */
    async getMetricsByDate(date: string): Promise<DailyZoneCleaningMetrics[]> {
        const targetDate = new Date(date);

        return this.prisma.dailyZoneCleaningMetrics.findMany({
            where: {
                date: targetDate,
            },
            orderBy: {
                zoneName: 'asc',
            },
        });
    }

    /**
     * Get metrics for a specific zone and date
     * @param zoneId - Zone identifier
     * @param date - Date to query (YYYY-MM-DD), optional
     * @returns Metrics for the specified zone
     */
    async getMetricsByZone(
        zoneId: string,
        date?: string,
    ): Promise<DailyZoneCleaningMetrics[]> {
        const where: any = {
            zoneId: zoneId,
        };

        if (date) {
            where.date = new Date(date);
        }

        return this.prisma.dailyZoneCleaningMetrics.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
        });
    }

    /**
     * Get all unique dates in the database
     * @returns Array of dates with data
     */
    async getAvailableDates(): Promise<Date[]> {
        const result = await this.prisma.dailyZoneCleaningMetrics.findMany({
            select: {
                date: true,
            },
            distinct: ['date'],
            orderBy: {
                date: 'desc',
            },
        });

        return result.map((r) => r.date);
    }

    /**
     * Get statistics summary for a date
     * @param date - Date to query
     * @returns Summary statistics
     */
    async getStatsByDate(date: string) {
        const targetDate = new Date(date);

        const metrics = await this.prisma.dailyZoneCleaningMetrics.findMany({
            where: { date: targetDate },
        });

        if (metrics.length === 0) {
            return null;
        }

        const totalZones = metrics.length;
        const totalPax = metrics.reduce((sum, m) => sum + (m.paxTotal || 0), 0);
        const totalMaintenanceSeconds = metrics.reduce((sum, m) => sum + (m.dureeMaintenanceSeconds || 0), 0);
        const totalAdditionnelleSeconds = metrics.reduce((sum, m) => sum + (m.dureeAdditionnelleSeconds || 0), 0);
        const totalOccurrencesMaintenance = metrics.reduce((sum, m) => sum + (m.occurrencesMaintenance || 0), 0);
        const totalOccurrencesAdditionnelles = metrics.reduce((sum, m) => sum + (m.occurrencesAdditionnelles || 0), 0);

        return {
            date: targetDate,
            totalZones,
            totalPax,
            totalMaintenanceHours: Math.round(totalMaintenanceSeconds / 3600 * 100) / 100,
            totalAdditionnelleHours: Math.round(totalAdditionnelleSeconds / 3600 * 100) / 100,
            totalOccurrencesMaintenance,
            totalOccurrencesAdditionnelles,
        };
    }
}
