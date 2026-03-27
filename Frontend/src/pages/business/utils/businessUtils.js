import { KOREAN_WEEKDAYS } from './businessConstants';

export const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat('ko-KR').format(Number.isFinite(numeric) ? numeric : 0);
};

export const formatCurrency = (value) => `${formatNumber(value)}원`;

export const padTwoDigits = (value) => String(value).padStart(2, '0');

export const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map((v) => Number(v));
    if ([year, month, day, hour, minute, second].every((v) => Number.isFinite(v))) {
      const dateFromArray = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(dateFromArray.getTime())) {
        return dateFromArray;
      }
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const formatDateTime = (value) => {
  const date = parseDateValue(value);
  if (!date) {
    return '-';
  }

  return `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())} ${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
};

export const formatDateOnly = (value) => {
  const date = parseDateValue(value);
  if (!date) {
    return '-';
  }
  return `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())}`;
};

export const formatHeaderDate = (date = new Date()) =>
  `${date.getFullYear()}.${padTwoDigits(date.getMonth() + 1)}.${padTwoDigits(date.getDate())} (${KOREAN_WEEKDAYS[date.getDay()]})`;

export const buildHourlySeries = (hourlyAuthCounts) => {
  const seeded = Array.from({ length: 24 }, (_, hourOfDay) => ({ hourOfDay, authCount: 0 }));
  if (!Array.isArray(hourlyAuthCounts)) {
    return seeded;
  }

  hourlyAuthCounts.forEach((item) => {
    const parsedHour = Number(item?.hourOfDay ?? item?.hour ?? item?.hourKey);
    const parsedCount = Number(item?.authCount ?? 0);
    if (!Number.isFinite(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      return;
    }

    seeded[parsedHour].authCount = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
  });

  return seeded;
};

export const sanitizeFileName = (value) =>
  String(value || 'store')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
