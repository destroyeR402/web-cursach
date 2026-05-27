'use strict';

const { expect } = require('chai');
const { hashPassword, verifyPassword } = require('../../utils/password.util');
const { slugify } = require('../../utils/slug.util');
const { rangesOverlap, startOfDay, endOfDay } = require('../../utils/date.util');

describe('utils/password', () => {
  it('хеширует и проверяет пароль', async () => {
    const h = await hashPassword('Password123');
    expect(h).to.be.a('string').and.have.lengthOf.above(40);
    expect(await verifyPassword('Password123', h)).to.equal(true);
    expect(await verifyPassword('wrong', h)).to.equal(false);
  });

  it('отклоняет короткий пароль', async () => {
    try { await hashPassword('123'); expect.fail('ожидалась ошибка'); }
    catch (e) { expect(e.status).to.equal(400); }
  });
});

describe('utils/slug', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugify('Первый канал')).to.equal('pervyy-kanal');
    expect(slugify('Матч ТВ!')).to.equal('match-tv');
  });
});

describe('utils/date', () => {
  it('startOfDay/endOfDay', () => {
    const d = new Date('2025-03-15T13:42:00');
    expect(startOfDay(d).getHours()).to.equal(0);
    expect(endOfDay(d).getHours()).to.equal(23);
  });

  it('rangesOverlap', () => {
    const a = new Date('2025-01-01T10:00'), b = new Date('2025-01-01T11:00');
    const c = new Date('2025-01-01T10:30'), d = new Date('2025-01-01T11:30');
    expect(rangesOverlap(a, b, c, d)).to.equal(true);
    const e = new Date('2025-01-01T11:00'), f = new Date('2025-01-01T12:00');
    expect(rangesOverlap(a, b, e, f)).to.equal(false);
  });
});
