import { CrowdInformationParser } from './crowd-information.parser';
import { ExcelParserService } from '../excel-parser.service';
import * as XLSX from 'xlsx';

describe('CrowdInformationParser', () => {
    let parser: CrowdInformationParser;
    let excelParserService: ExcelParserService;

    beforeEach(() => {
        excelParserService = new ExcelParserService();
        parser = new CrowdInformationParser(excelParserService);
    });

    describe('parse', () => {
        it('should aggregate PAX by zone correctly', () => {
            const mockRows = [
                { bucketStart: '1900-01-01 10:00:00', nbPax: 100, 'zone.id': 'Zone A', 'zoneGroup.id': null },
                { bucketStart: '1900-01-01 10:30:00', nbPax: 150, 'zone.id': 'Zone A', 'zoneGroup.id': null },
                { bucketStart: '1900-01-01 11:00:00', nbPax: 200, 'zone.id': 'Zone B', 'zoneGroup.id': null },
            ];

            jest.spyOn(excelParserService, 'getSheetAsJson').mockReturnValue(mockRows);

            const workbook = {} as XLSX.WorkBook;
            const groupMapping = new Map<string, string[]>();
            const result = parser.parse(workbook, groupMapping);

            expect(result.get('Zone A')).toBe(250); // 100 + 150
            expect(result.get('Zone B')).toBe(200);
            expect(result.size).toBe(2);
        });

        it('should ignore rows without zone.id', () => {
            const mockRows = [
                { bucketStart: '1900-01-01 10:00:00', nbPax: 100, 'zone.id': null, 'zoneGroup.id': 'Group 1' },
                { bucketStart: '1900-01-01 10:30:00', nbPax: 150, 'zone.id': 'Zone A', 'zoneGroup.id': null },
            ];

            jest.spyOn(excelParserService, 'getSheetAsJson').mockReturnValue(mockRows);

            const workbook = {} as XLSX.WorkBook;
            const groupMapping = new Map<string, string[]>();
            const result = parser.parse(workbook, groupMapping);

            expect(result.get('Zone A')).toBe(150);
            expect(result.has('Group 1')).toBe(false);
            expect(result.size).toBe(1);
        });

        it('should handle zero and null PAX values', () => {
            const mockRows = [
                { bucketStart: '1900-01-01 10:00:00', nbPax: 0, 'zone.id': 'Zone A', 'zoneGroup.id': null },
                { bucketStart: '1900-01-01 10:30:00', nbPax: null, 'zone.id': 'Zone A', 'zoneGroup.id': null },
                { bucketStart: '1900-01-01 11:00:00', nbPax: 100, 'zone.id': 'Zone A', 'zoneGroup.id': null },
            ];

            jest.spyOn(excelParserService, 'getSheetAsJson').mockReturnValue(mockRows);

            const workbook = {} as XLSX.WorkBook;
            const groupMapping = new Map<string, string[]>();
            const result = parser.parse(workbook, groupMapping);

            expect(result.get('Zone A')).toBe(100); // 0 + 0 + 100
        });

        it('should return empty map for empty sheet', () => {
            jest.spyOn(excelParserService, 'getSheetAsJson').mockReturnValue([]);

            const workbook = {} as XLSX.WorkBook;
            const groupMapping = new Map<string, string[]>();
            const result = parser.parse(workbook, groupMapping);

            expect(result.size).toBe(0);
        });
    });
});
