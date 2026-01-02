import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelParserService } from '../excel-parser.service';

export interface ZoneData {
    id: string;
    name: string;
    zoneGroupId?: string; // Add zone group reference
}

interface ZoneRow {
    id: string;
    name: string;
    'zoneGroup.id'?: string;
    'direction.id'?: string;
    critical?: boolean;
    isPublic?: boolean;
}

/**
 * Parser for Zone sheet
 * Extracts zone ID, names, and zone group associations
 */
@Injectable()
export class ZoneParser {
    constructor(private excelParserService: ExcelParserService) { }

    /**
     * Parse Zone sheet to extract zone data
     * @param workbook - Excel workbook
     * @returns Map of zone ID to zone data
     */
    parse(workbook: XLSX.WorkBook): Map<string, ZoneData> {
        const rows = this.excelParserService.getSheetAsJson<ZoneRow>(workbook, 'Zone');

        const zoneMap = new Map<string, ZoneData>();

        for (const row of rows) {
            if (!row.id) {
                continue; // Skip rows without ID
            }

            zoneMap.set(row.id, {
                id: row.id,
                name: row.name || row.id, // Fallback to ID if name is missing
                zoneGroupId: row['zoneGroup.id'], // Store zone group reference
            });
        }

        console.log(`✅ Parsed ${zoneMap.size} zones`);
        return zoneMap;
    }

    /**
     * Get group to zones mapping
     * Returns a map of zoneGroup.id to array of zone IDs
     */
    getGroupMapping(workbook: XLSX.WorkBook): Map<string, string[]> {
        const rows = this.excelParserService.getSheetAsJson<ZoneRow>(workbook, 'Zone');
        const groupMap = new Map<string, string[]>();

        for (const row of rows) {
            if (!row.id || !row['zoneGroup.id']) {
                continue;
            }

            const groupId = row['zoneGroup.id'];
            if (!groupMap.has(groupId)) {
                groupMap.set(groupId, []);
            }
            groupMap.get(groupId)!.push(row.id);
        }

        console.log(`✅ Mapped ${groupMap.size} zone groups`);
        return groupMap;
    }
}

