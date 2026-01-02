import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelParserService } from '../excel-parser.service';

interface CrowdRow {
    bucketStart: string;
    nbPax: number;
    'zone.id': string | null;
    'zoneGroup.id': string | null;
}

/**
 * Parser for CrowdInformation sheet
 * Aggregates passenger counts (PAX) by zone
 */
@Injectable()
export class CrowdInformationParser {
    constructor(private excelParserService: ExcelParserService) { }

    /**
     * Parse CrowdInformation sheet
     * Aggregates nbPax by zone AND zoneGroup
     * @param workbook - Excel workbook
     * @param groupMapping - Map of zoneGroup.id to zone IDs
     * @returns Map of zone ID to total PAX
     */
    parse(workbook: XLSX.WorkBook, groupMapping: Map<string, string[]>): Map<string, number> {
        const rows = this.excelParserService.getSheetAsJson<CrowdRow>(workbook, 'CrowdInformation');

        const paxMap = new Map<string, number>();

        for (const row of rows) {
            const pax = row.nbPax || 0;

            // Case 1: Individual zone.id
            if (row['zone.id']) {
                const zoneId = row['zone.id'];
                paxMap.set(zoneId, (paxMap.get(zoneId) || 0) + pax);
            }

            // Case 2: zoneGroup.id - distribute to all member zones
            if (row['zoneGroup.id']) {
                const groupId = row['zoneGroup.id'];
                const memberZones = groupMapping.get(groupId) || [];

                // Distribute PAX fully to each member zone
                for (const zoneId of memberZones) {
                    paxMap.set(zoneId, (paxMap.get(zoneId) || 0) + pax);
                }
            }
        }

        console.log(`✅ Parsed ${paxMap.size} zones with PAX data`);
        return paxMap;
    }
}
