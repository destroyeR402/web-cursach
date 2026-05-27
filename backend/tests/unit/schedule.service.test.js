'use strict';

const { expect } = require('chai');
const { rangesOverlap, startOfDay, endOfDay, addDays } = require('../../utils/date.util');

// === Юнит-тесты бизнес-логики сетки вещания ===
// Тестируем чистые функции из utils, которые использует schedule.service
// (полная интеграция с БД проверяется в integration-тестах)

describe('schedule.service — проверка пересечений слотов', () => {
  it('два слота на одном канале с пересечением → конфликт', () => {
    const a = { starts_at: new Date('2026-05-27T10:00:00'), ends_at: new Date('2026-05-27T11:00:00') };
    const b = { starts_at: new Date('2026-05-27T10:30:00'), ends_at: new Date('2026-05-27T11:30:00') };
    expect(rangesOverlap(a.starts_at, a.ends_at, b.starts_at, b.ends_at)).to.equal(true);
  });

  it('слот, начинающийся ровно когда заканчивается другой → НЕ конфликт', () => {
    const a = { starts_at: new Date('2026-05-27T10:00:00'), ends_at: new Date('2026-05-27T11:00:00') };
    const b = { starts_at: new Date('2026-05-27T11:00:00'), ends_at: new Date('2026-05-27T12:00:00') };
    expect(rangesOverlap(a.starts_at, a.ends_at, b.starts_at, b.ends_at)).to.equal(false);
  });

  it('слот полностью внутри другого → конфликт', () => {
    const outer = { s: new Date('2026-05-27T10:00:00'), e: new Date('2026-05-27T13:00:00') };
    const inner = { s: new Date('2026-05-27T11:00:00'), e: new Date('2026-05-27T12:00:00') };
    expect(rangesOverlap(outer.s, outer.e, inner.s, inner.e)).to.equal(true);
  });

  it('слоты в разные дни → НЕ конфликт', () => {
    const a = { s: new Date('2026-05-27T20:00:00'), e: new Date('2026-05-27T22:00:00') };
    const b = { s: new Date('2026-05-28T20:00:00'), e: new Date('2026-05-28T22:00:00') };
    expect(rangesOverlap(a.s, a.e, b.s, b.e)).to.equal(false);
  });

  it('слот заканчивается до начала другого → НЕ конфликт', () => {
    const a = { s: new Date('2026-05-27T10:00:00'), e: new Date('2026-05-27T11:00:00') };
    const b = { s: new Date('2026-05-27T14:00:00'), e: new Date('2026-05-27T15:00:00') };
    expect(rangesOverlap(a.s, a.e, b.s, b.e)).to.equal(false);
  });
});

describe('schedule.service — границы суток', () => {
  it('startOfDay/endOfDay корректно вычисляют границы', () => {
    const d = new Date('2026-05-27T15:42:33');
    const s = startOfDay(d);
    const e = endOfDay(d);
    expect(s.getHours()).to.equal(0);
    expect(s.getMinutes()).to.equal(0);
    expect(e.getHours()).to.equal(23);
    expect(e.getMinutes()).to.equal(59);
  });

  it('addDays корректно сдвигает дату', () => {
    const d = new Date('2026-05-27');
    expect(addDays(d, 1).getDate()).to.equal(28);
    expect(addDays(d, -1).getDate()).to.equal(26);
    expect(addDays(d, 7).getDate()).to.equal(3); // переход через месяц
  });
});

describe('schedule.service — валидация слота (логика)', () => {
  it('ends_at должно быть строго больше starts_at', () => {
    const slot = { starts_at: new Date('2026-05-27T10:00:00'), ends_at: new Date('2026-05-27T09:00:00') };
    expect(slot.ends_at <= slot.starts_at).to.equal(true); // невалидный слот
  });

  it('длительность слота в минутах', () => {
    const start = new Date('2026-05-27T10:00:00');
    const end = new Date('2026-05-27T11:30:00');
    const minutes = (end - start) / 60000;
    expect(minutes).to.equal(90);
  });
});

describe('schedule.service — проверка целостности сетки', () => {
  // имитируем slotModel.listForChannelInRange + проверку из publishDay
  function hasOverlapInGrid(slots) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (rangesOverlap(slots[i].starts_at, slots[i].ends_at, slots[j].starts_at, slots[j].ends_at)) {
          return true;
        }
      }
    }
    return false;
  }

  it('корректная сетка без пересечений → можно публиковать', () => {
    const slots = [
      { starts_at: new Date('2026-05-27T06:00'), ends_at: new Date('2026-05-27T06:30') },
      { starts_at: new Date('2026-05-27T06:30'), ends_at: new Date('2026-05-27T08:00') },
      { starts_at: new Date('2026-05-27T08:00'), ends_at: new Date('2026-05-27T09:00') },
    ];
    expect(hasOverlapInGrid(slots)).to.equal(false);
  });

  it('сетка с пересечением → публикация запрещена', () => {
    const slots = [
      { starts_at: new Date('2026-05-27T06:00'), ends_at: new Date('2026-05-27T07:00') },
      { starts_at: new Date('2026-05-27T06:30'), ends_at: new Date('2026-05-27T07:30') }, // overlap
    ];
    expect(hasOverlapInGrid(slots)).to.equal(true);
  });

  it('пустая сетка → нет конфликтов', () => {
    expect(hasOverlapInGrid([])).to.equal(false);
  });
});
