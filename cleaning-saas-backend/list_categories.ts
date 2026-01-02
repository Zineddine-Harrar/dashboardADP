
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Suppress console spam from libs
const originalConsoleWarn = console.warn;
// console.warn = () => {}; 

function main() {
    console.log('Searching for Excel files...');
    const dir = path.resolve('./data/input/novembre');

    let files: string[] = [];
    try {
        files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
    } catch (e) {
        console.error('Error reading directory:', e);
        return;
    }

    if (files.length === 0) {
        console.error('No Excel files found in', dir);
        return;
    }

    // Process all files
    for (const file of files) {
        const fullPath = path.join(dir, file);
        processFile(fullPath);
    }
}

function processFile(filePath: string) {
    console.log(`\n--- Processing ${path.basename(filePath)} ---`);
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = 'ZoneDemandCategoryKpi';

        if (!workbook.Sheets[sheetName]) {
            console.log(`Sheet '${sheetName}' NOT found.`);
            return;
        }

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const categories = new Set<string>();

        data.forEach((row: any) => {
            if (row['demandCategory.id']) {
                categories.add(row['demandCategory.id']);
            }
        });

        const output = Array.from(categories);
        console.log('✅ FOUND CATEGORIES:', output);
        fs.writeFileSync('categories_output.txt', JSON.stringify(output, null, 2));
    } catch (error) {
        fs.writeFileSync('categories_error.txt', error.message);
    }
}

main();
