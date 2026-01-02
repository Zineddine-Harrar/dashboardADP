import { durationToSeconds, secondsToDuration } from './time.utils';

describe('TimeUtils', () => {
    describe('durationToSeconds', () => {
        it('should convert simple HH:MM:SS format to seconds', () => {
            expect(durationToSeconds('01:30:45')).toBe(5445);
            expect(durationToSeconds('00:05:30')).toBe(330);
            expect(durationToSeconds('02:00:00')).toBe(7200);
        });

        it('should handle "X days HH:MM:SS" format', () => {
            expect(durationToSeconds('0 days 01:30:45')).toBe(5445);
            expect(durationToSeconds('2 days 03:15:30')).toBe(184530);
            expect(durationToSeconds('1 day 00:00:00')).toBe(86400);
        });

        it('should return 0 for null or undefined', () => {
            expect(durationToSeconds(null)).toBe(0);
            expect(durationToSeconds(undefined)).toBe(0);
        });

        it('should return 0 for invalid formats', () => {
            expect(durationToSeconds('NaN')).toBe(0);
            expect(durationToSeconds('NaT')).toBe(0);
            expect(durationToSeconds('invalid')).toBe(0);
        });

        it('should handle edge cases', () => {
            expect(durationToSeconds('00:00:00')).toBe(0);
            expect(durationToSeconds('23:59:59')).toBe(86399);
        });
    });

    describe('secondsToDuration', () => {
        it('should convert seconds to HH:MM:SS format', () => {
            expect(secondsToDuration(5445)).toBe('01:30:45');
            expect(secondsToDuration(330)).toBe('00:05:30');
            expect(secondsToDuration(7200)).toBe('02:00:00');
        });

        it('should handle large values', () => {
            expect(secondsToDuration(86400)).toBe('24:00:00');
            expect(secondsToDuration(90000)).toBe('25:00:00');
        });

        it('should handle zero', () => {
            expect(secondsToDuration(0)).toBe('00:00:00');
        });
    });
});
