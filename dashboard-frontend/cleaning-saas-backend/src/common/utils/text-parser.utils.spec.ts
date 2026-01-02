import { parseVisitBoundsExplanation } from './text-parser.utils';

describe('TextParserUtils', () => {
    describe('parseVisitBoundsExplanation', () => {
        it('should parse standard format correctly', () => {
            const text = 'Specific WOs: 0, Alert WOs: 0, Reinforcement Occurrences: 1, Maintenance Occurrences: 4';
            const result = parseVisitBoundsExplanation(text);

            expect(result).toEqual({
                specificWOs: 0,
                alertWOs: 0,
                reinforcementOccurrences: 1,
                maintenanceOccurrences: 4,
            });
        });

        it('should handle different number values', () => {
            const text = 'Specific WOs: 5, Alert WOs: 2, Reinforcement Occurrences: 10, Maintenance Occurrences: 15';
            const result = parseVisitBoundsExplanation(text);

            expect(result).toEqual({
                specificWOs: 5,
                alertWOs: 2,
                reinforcementOccurrences: 10,
                maintenanceOccurrences: 15,
            });
        });

        it('should handle null or undefined input', () => {
            expect(parseVisitBoundsExplanation(null)).toEqual({
                specificWOs: 0,
                alertWOs: 0,
                reinforcementOccurrences: 0,
                maintenanceOccurrences: 0,
            });

            expect(parseVisitBoundsExplanation(undefined)).toEqual({
                specificWOs: 0,
                alertWOs: 0,
                reinforcementOccurrences: 0,
                maintenanceOccurrences: 0,
            });
        });

        it('should handle partial matches', () => {
            const text = 'Reinforcement Occurrences: 3, Maintenance Occurrences: 7';
            const result = parseVisitBoundsExplanation(text);

            expect(result.reinforcementOccurrences).toBe(3);
            expect(result.maintenanceOccurrences).toBe(7);
            expect(result.specificWOs).toBe(0);
            expect(result.alertWOs).toBe(0);
        });

        it('should be case insensitive', () => {
            const text = 'REINFORCEMENT OCCURRENCES: 2, maintenance occurrences: 6';
            const result = parseVisitBoundsExplanation(text);

            expect(result.reinforcementOccurrences).toBe(2);
            expect(result.maintenanceOccurrences).toBe(6);
        });

        it('should handle malformed input gracefully', () => {
            const text = 'Random text without proper format';
            const result = parseVisitBoundsExplanation(text);

            expect(result).toEqual({
                specificWOs: 0,
                alertWOs: 0,
                reinforcementOccurrences: 0,
                maintenanceOccurrences: 0,
            });
        });
    });
});
