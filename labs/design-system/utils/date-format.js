// Minimal date/time formatting utilities shared across design-system
export function formatTime12(input) {
    if (input === null || input === undefined || input === '') return '';
    const s = String(input).trim();

    // Accept HH:MM or HH:MM AM/PM
    const timeMatch = s.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?$/);
    if (timeMatch) {
        let hh = parseInt(timeMatch[1], 10);
        const mm = timeMatch[2].padStart(2, '0');
        const ampm = timeMatch[3];
        if (ampm) {
            const up = ampm.toUpperCase();
            if (up === 'PM' && hh !== 12) hh = hh + 12;
            if (up === 'AM' && hh === 12) hh = 0;
        }
        return to12(hh, mm);
    }

    // Try Date parsing
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
        const hh = d.getHours();
        const mm = d.getMinutes().toString().padStart(2, '0');
        return to12(hh, mm);
    }

    // Fallback
    return '12:00 PM';
}

function to12(hour24, minuteStr) {
    const h24 = Number(hour24);
    const m = String(minuteStr).padStart(2, '0');
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12.toString().padStart(2, '0')}:${m} ${period}`;
}

export default { formatTime12 };

// Human-friendly date/time: Today 3:05 PM | Yesterday 11:22 AM | Sep 19, 2025 2:05 PM
export function formatHuman(input) {
    if (input === null || input === undefined || input === '') return '';
    const ts = (typeof input === 'number') ? input : Number(input);
    let date;
    if (!isNaN(ts)) date = new Date(ts);
    else date = new Date(String(input));
    if (isNaN(date.getTime())) return String(input);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const dateStr = date.toISOString().slice(0, 10);
    const time = to12(date.getHours(), String(date.getMinutes()).padStart(2, '0'));

    if (dateStr === todayStr) return `Today ${time}`;

    // Yesterday check
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);
    if (dateStr === yStr) return `Yesterday ${time}`;

    // Older: short date + time
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    const datePart = date.toLocaleDateString(undefined, opts);
    return `${datePart} ${time}`;
}
