import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelParserService } from '../excel-parser.service';
import { parseVisitBoundsExplanation } from '../../../common/utils/text-parser.utils';

export interface ZoneKpiData {
    zoneId: string;
    maintenanceOccurrences: number;
    reinforcementOccurrences: number;
    alertWOs: number;
    minVisits: number;
    maxVisits: number;
    nbVisits: number;
}

interface ZoneKpiRow {
    'zone.id': string;
    nbVisits?: number;
    maxVisits?: number;
    minVisits?: number;
    visitBoundsExplanation?: string;
}

/**
 * Parser for ZoneKpi sheet
 * Extracts occurrence data from visitBoundsExplanation
 */
@Injectable()
export class ZoneKpiParser {
    constructor(private excelParserService: ExcelParserService) { }

    /**
     * Parse ZoneKpi sheet to extract occurrence data
     * @param workbook - Excel workbook
     * @returns Map of zone ID to KPI data
     */
    parse(workbook: XLSX.WorkBook): Map<string, ZoneKpiData> {
        const rows = this.excelParserService.getSheetAsJson<ZoneKpiRow>(workbook, 'ZoneKpi');

        const kpiMap = new Map<string, ZoneKpiData>();

        for (const row of rows) {
            if (!row['zone.id']) {
                continue;
            }

            const parsed = parseVisitBoundsExplanation(row.visitBoundsExplanation);

            kpiMap.set(row['zone.id'], {
                zoneId: row['zone.id'],
                maintenanceOccurrences: parsed.maintenanceOccurrences,
                reinforcementOccurrences: parsed.reinforcementOccurrences,
                alertWOs: parsed.alertWOs,
                minVisits: row.minVisits || 0,
                maxVisits: row.maxVisits || 0,
                nbVisits: row.nbVisits || 0,
            });
        }

        console.log(`✅ Parsed ${kpiMap.size} zone KPIs`);
        return kpiMap;
    }
}
