export function parseFlexibleDate(value) {
    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value) && value.length >= 3) {
        const year = Number(value[0]);
        const month = Number(value[1]);
        const day = Number(value[2]);
        const hour = Number(value[3] ?? 0);
        const minute = Number(value[4] ?? 0);
        const second = Number(value[5] ?? 0);

        if (
            Number.isFinite(year) &&
            Number.isFinite(month) &&
            Number.isFinite(day) &&
            Number.isFinite(hour) &&
            Number.isFinite(minute) &&
            Number.isFinite(second)
        ) {
            return new Date(year, month - 1, day, hour, minute, second);
        }
    }

    if (typeof value === 'string' && /^\d{4},\d{1,2},\d{1,2}(,\d{1,2}){0,3}$/.test(value.trim())) {
        const parts = value.split(',').map((part) => Number(part.trim()));
        return parseFlexibleDate(parts);
    }

    if (typeof value === 'object' && value !== null) {
        const year = Number(value.year);
        const month = Number(value.monthValue ?? value.month);
        const day = Number(value.dayOfMonth ?? value.day);
        const hour = Number(value.hour ?? 0);
        const minute = Number(value.minute ?? 0);
        const second = Number(value.second ?? 0);

        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
            return new Date(year, month - 1, day, hour, minute, second);
        }
    }

    return new Date(value);
}

export function formatDateYmd(value, fallback = '-') {
    if (!value) {
        return fallback;
    }

    const parsed = parseFlexibleDate(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatDateYmdHm(value, fallback = '-') {
    if (!value) {
        return fallback;
    }

    const parsed = parseFlexibleDate(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hour = String(parsed.getHours()).padStart(2, '0');
    const minute = String(parsed.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
}
