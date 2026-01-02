/**
 * Utility functions for parsing text fields from Excel
 */

export interface VisitBoundsData {
    specificWOs: number;
    alertWOs: number;
    reinforcementOccurrences: number;
    maintenanceOccurrences: number;
}

/**
 * Parses the visitBoundsExplanation string to extract occurrence counts
 * 
 * @param text - The visitBoundsExplanation text from ZoneKpi sheet
 * @returns Parsed data with occurrence counts
 * 
 * @example
 * parseVisitBoundsExplanation("Specific WOs: 0, Alert WOs: 0, Reinforcement Occurrences: 1, Maintenance Occurrences: 4")
 * // returns { specificWOs: 0, alertWOs: 0, reinforcementOccurrences: 1, maintenanceOccurrences: 4 }
 */
export function parseVisitBoundsExplanation(
    text: string | null | undefined,
): VisitBoundsData {
    const defaultResult: VisitBoundsData = {
        specificWOs: 0,
        alertWOs: 0,
        reinforcementOccurrences: 0,
        maintenanceOccurrences: 0,
    };

    if (!text) {
        return defaultResult;
    }

    try {
        // Extract numbers using regex patterns
        const specificMatch = text.match(/Specific\s+WOs?:\s*(\d+)/i);
        const alertMatch = text.match(/Alert\s+WOs?:\s*(\d+)/i);
        const reinforcementMatch = text.match(/Reinforcement\s+Occurrences?:\s*(\d+)/i);
        const maintenanceMatch = text.match(/Maintenance\s+Occurrences?:\s*(\d+)/i);

        return {
            specificWOs: specificMatch ? parseInt(specificMatch[1], 10) : 0,
            alertWOs: alertMatch ? parseInt(alertMatch[1], 10) : 0,
            reinforcementOccurrences: reinforcementMatch ? parseInt(reinforcementMatch[1], 10) : 0,
            maintenanceOccurrences: maintenanceMatch ? parseInt(maintenanceMatch[1], 10) : 0,
        };
    } catch (error) {
        console.error(`Error parsing visitBoundsExplanation "${text}":`, error);
        return defaultResult;
    }
}
