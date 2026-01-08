import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SpmService {
    getSpmData(year?: string) {
        try {
            const spmDir = path.join(process.cwd(), 'data/input/spm');
            // ... (keep the rest)
            if (!fs.existsSync(spmDir)) {
                throw new Error(`Directory not found: ${spmDir}`);
            }

            const files = fs.readdirSync(spmDir).filter(f => f.endsWith('-SPM.xlsx'));
            if (files.length === 0) {
                throw new Error(`No SPM file found in ${spmDir}`);
            }

            let targetFile: string;
            if (year) {
                const matching = files.find(f => f.startsWith(year));
                if (matching) {
                    targetFile = path.join(spmDir, matching);
                } else {
                    // Fallback to latest if year not found
                    const sortedFiles = files.sort((a, b) => b.localeCompare(a));
                    targetFile = path.join(spmDir, sortedFiles[0]);
                }
            } else {
                // By default, pick the latest year found in filenames
                const sortedFiles = files.sort((a, b) => b.localeCompare(a));
                targetFile = path.join(spmDir, sortedFiles[0]);
            }

            const workbook = XLSX.readFile(targetFile);
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
