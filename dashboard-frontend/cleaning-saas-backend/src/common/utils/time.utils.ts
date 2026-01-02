/**
 * Utility functions for time and duration conversions
 */

/**
 * Convert duration string/Date to seconds
 * Handles formats:
 * - "HH:MM:SS"
 * - "X days HH:MM:SS"  
 * - Date objects (from Excel time values)
 */
export function durationToSeconds(duration: string | Date | null | undefined): number {
    if (!duration) {
        return 0;
    }

    // Handle Date objects (Excel stores durations as dates starting from 1899-12-30)
    if (duration instanceof Date || typeof duration === 'object') {
        try {
            const dateObj = duration as Date;
            const hours = dateObj.getHours();
            const minutes = dateObj.getMinutes();
            const seconds = dateObj.getSeconds();
            return hours * 3600 + minutes * 60 + seconds;
        } catch (error) {
            console.error('Error parsing Date duration:', error);
            return 0;
        }
    }

    // Handle string format
    const durationStr = String(duration);

    if (durationStr === 'NaN' || durationStr === 'NaT') {
        return 0;
    }

    try {
        // Handle "X days HH:MM:SS" format
        const daysMatch = durationStr.match(/(\d+)\s+days?\s+(\d{1,2}):(\d{2}):(\d{2})/);
        if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            const hours = parseInt(daysMatch[2], 10);
            const minutes = parseInt(daysMatch[3], 10);
            const seconds = parseInt(daysMatch[4], 10);
            return days * 86400 + hours * 3600 + minutes * 60 + seconds;
        }

        // Handle simple "HH:MM:SS" format
        const simpleMatch = durationStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
        if (simpleMatch) {
            const hours = parseInt(simpleMatch[1], 10);
            const minutes = parseInt(simpleMatch[2], 10);
            const seconds = parseInt(simpleMatch[3], 10);
            return hours * 3600 + minutes * 60 + seconds;
        }

        return 0;
    } catch (error) {
        console.error(`Error parsing duration "${durationStr}":`, error);
        return 0;
    }
}

/**
 * Converts seconds to HH:MM:SS format
 */
export function secondsToDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
