'use strict';

function startOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}

function addDays(d, n) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}

function toISODate(d) {
  // ВАЖНО: используем локальные геттеры, не toISOString (он отдаёт UTC и смещает дату на сутки)
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(d) {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

module.exports = { startOfDay, endOfDay, addDays, toISODate, formatTime, rangesOverlap };
