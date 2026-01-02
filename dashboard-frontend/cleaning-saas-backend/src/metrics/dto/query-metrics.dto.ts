import { IsDateString, IsOptional } from 'class-validator';

/**
 * DTO for querying metrics
 */
export class QueryMetricsDto {
    @IsDateString()
    date: string; // Format: YYYY-MM-DD
}

/**
 * DTO for querying a specific zone's metrics
 */
export class QueryZoneMetricsDto {
    @IsDateString()
    @IsOptional()
    date?: string; // Format: YYYY-MM-DD, optional
}
