import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

/**
 * Generic Excel parser service
 * Provides utilities to read and parse Excel files
 */
@Injectable()
export class ExcelParserService {
    /**
     * Read an Excel file and return the workbook
     * @param filePath - Path to the Excel file
     * @returns XLSX Workbook
     */
    readExcelFile(filePath: string): XLSX.WorkBook {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Excel file not found: ${filePath}`);
        }

        const buffer = fs.readFileSync(filePath);
        return XLSX.read(buffer, { type: 'buffer', cellDates: true });
    }

    /**
     * Get a specific sheet as JSON array
     * @param workbook - XLSX Workbook
     * @param sheetName - Name of the sheet to parse
     * @returns Array of row objects
     */
    getSheetAsJson<T = any>(workbook: XLSX.WorkBook, sheetName: string): T[] {
        if (!workbook.SheetNames.includes(sheetName)) {
            console.warn(`Sheet "${sheetName}" not found in workbook`);
            return [];
        }

        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json<T>(sheet, { defval: null });
    }

    /**
     * Check if a sheet exists in the workbook
     * @param workbook - XLSX Workbook
     * @param sheetName - Name of the sheet
     * @returns True if sheet exists
     */
    hasSheet(workbook: XLSX.WorkBook, sheetName: string): boolean {
        return workbook.SheetNames.includes(sheetName);
    }

    /**
     * Get all sheet names from a workbook
     * @param workbook - XLSX Workbook
     * @returns Array of sheet names
     */
    getSheetNames(workbook: XLSX.WorkBook): string[] {
        return workbook.SheetNames;
    }
}
