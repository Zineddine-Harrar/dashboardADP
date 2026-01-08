import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SpmService {
    private readonly filePath = path.join(process.cwd(), 'data/input/spm/2025-SPM.xlsx');

    getSpmData() {
        try {
            if (!fs.existsSync(this.filePath)) {
                throw new Error(`File not found: ${this.filePath}`);
            }

            const workbook = XLSX.readFile(this.filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Structure the data (Skip header row 0)
            // Row 0: ['Zones', 'Objectif', '04-25', ...]
            const headerRow = jsonData[0] as string[];
            const months = headerRow.slice(2); // ['04-25', '05-25'...]

            const rows = jsonData.slice(1);
            const formattedData = rows.map((row: any[]) => {
                if (!row || row.length === 0) return null;
                const zoneName = row[0];
                const objective = row[1];
                const notes: Record<string, any> = {};
                months.forEach((month, index) => {
                    notes[month] = row[index + 2];
                });

                return {
                    name: zoneName,
                    target: objective,
                    data: notes,
                    months: months
                };
            }).filter(item => item !== null && item.name);

            return {
                months,
                items: formattedData
            };

        } catch (error) {
            console.error('Error reading SPM file:', error);
            throw error;
        }
    }
}
