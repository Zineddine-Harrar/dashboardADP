import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelParserService } from '../excel-parser.service';

export interface GlobalParameterData {
    date: Date;
    timeZone?: string;
    timeGranularity?: string;
}

interface GlobalParameterRow {
    date: string | Date;
    timeZone?: string;
    timeGranularity?: string;
}

/**
 * Parser for GlobalParameter sheet
 * Extracts the scenario date and metadata
 */
@Injectable()
export class GlobalParameterParser {
    constructor(private excelParserService: ExcelParserService) { }

    /**
     * Parse GlobalParameter sheet to extract date
     * @param workbook - Excel workbook
     * @returns GlobalParameter data with date
     */
    parse(workbook: XLSX.WorkBook): GlobalParameterData | null {
        const rows = this.excelParserService.getSheetAsJson<GlobalParameterRow>(
            workbook,
            'GlobalParameter',
        );

        if (!rows || rows.length === 0) {
            console.warn('GlobalParameter sheet is empty');
            return null;
        }

        // Take the first row as there should be only one
        const firstRow = rows[0];

        if (!firstRow.date) {
            throw new Error('GlobalParameter sheet missing required "date" column');
        }

        // Convert to Date if it's a string
        let date: Date;
        if (firstRow.date instanceof Date) {
            date = firstRow.date;
        } else {
            date = new Date(firstRow.date);
            if (isNaN(date.getTime())) {
                throw new Error(`Invalid date in GlobalParameter: ${firstRow.date}`);
            }
        }

        return {
            date,
            timeZone: firstRow.timeZone || 'Europe/Paris',
            timeGranularity: firstRow.timeGranularity,
        };
    }
}
