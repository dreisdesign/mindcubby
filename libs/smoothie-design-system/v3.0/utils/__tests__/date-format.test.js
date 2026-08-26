import { describe, it, expect } from 'vitest';
import { formatTime12 } from '../date-format.js';

describe('formatTime12', () => {
    it('formats ISO date strings into 12-hour time', () => {
        const iso = '2025-09-19T14:05:00Z';
        const out = formatTime12(iso);
        // Depending on local timezone parsing, we only assert structure
        expect(/\d{2}:\d{2}\s(AM|PM)/.test(out)).toBe(true);
    });

    it('normalizes HH:MM to 12-hour format', () => {
        expect(formatTime12('00:00')).toBe('12:00 AM');
        expect(formatTime12('12:00')).toBe('12:00 PM');
        expect(formatTime12('15:30')).toBe('03:30 PM');
    });

    it('accepts HH:MM AM/PM inputs unchanged (normalized)', () => {
        expect(formatTime12('3:05 PM')).toBe('03:05 PM');
        expect(formatTime12('11:59 am')).toBe('11:59 AM');
    });

    it('returns fallback for invalid input', () => {
        expect(formatTime12('not a date')).toBe('12:00 PM');
        expect(formatTime12(null)).toBe('');
        expect(formatTime12(undefined)).toBe('');
    });
});
