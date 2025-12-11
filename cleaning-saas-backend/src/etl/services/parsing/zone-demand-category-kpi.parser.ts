import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelParserService } from '../excel-parser.service';
import { durationToSeconds } from '../../../common/utils/time.utils';

export interface ZoneDemandData {
    zoneId: string;
    demandCategoryId: string;
    durationSeconds: number;
}

interface ZoneDemandCategoryKpiRow {
    'zone.id': string;
    'demandCategory.id': string;
    workPlannedDuration?: string;
    nbWorkOrdersPlanned?: number;
    plannedWorkDurationRatio?: number;
}

/**
 * Parser for ZoneDemandCategoryKpi sheet
 * Extracts duration data for ENTRETIEN and RENFORT categories
 */
@Injectable()
export class ZoneDemandCategoryKpiParser {
    constructor(private excelParserService: ExcelParserService) { }

    /**
     * Parse ZoneDemandCategoryKpi sheet to extract duration by category
     * @param workbook - Excel workbook
     * @returns Map of [zoneId][categoryId] to duration in seconds
     */
    parse(workbook: XLSX.WorkBook): Map<string, Map<string, number>> {
        const rows = this.excelParserService.getSheetAsJson<ZoneDemandCategoryKpiRow>(
            workbook,
            'ZoneDemandCategoryKpi',
        );

        // Nested map: zoneId -> (categoryId -> durationSeconds)
        const demandMap = new Map<string, Map<string, number>>();

        for (const row of rows) {
            if (!row['zone.id'] || !row['demandCategory.id']) {
                continue;
            }

            const zoneId = row['zone.id'];
            const categoryId = row['demandCategory.id'];
            const duration = durationToSeconds(row.workPlannedDuration);

            if (!demandMap.has(zoneId)) {
                demandMap.set(zoneId, new Map());
            }

            demandMap.get(zoneId)!.set(categoryId, duration);
        }

        console.log(`✅ Parsed ${rows.length} zone demand category KPIs`);
        return demandMap;
    }

    /**
     * Get duration for a specific zone and category
     * @param demandMap - Parsed demand map
     * @param zoneId - Zone ID
     * @param categoryId - Category ID (e.g., 'ENTRETIEN', 'RENFORT')
     * @returns Duration in seconds, or 0 if not found
     */
    getDuration(
        demandMap: Map<string, Map<string, number>>,
        zoneId: string,
        categoryId: string,
    ): number {
        return demandMap.get(zoneId)?.get(categoryId) || 0;
    }
}
