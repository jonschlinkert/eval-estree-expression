'use strict';

const assert = require('assert').strict;
const { evaluate: e } = require('../support');

const opts = { functions: true, strict: true };

describe('built in objects', () => {
  it('should evaluate Array', () => {
    const ctx = { Array };
    assert.deepEqual(e.sync('new Array("1", ...arr)', { Array, arr: ['a', 'b'] }, opts), ['1', 'a', 'b']);
    assert.deepEqual(e.sync('new Array("1")', ctx, opts), ['1']);
    assert.deepEqual(e.sync('Array("1")', ctx, opts), ['1']);
    assert.deepEqual(e.sync('Array.from("1")', ctx, opts), ['1']);
  });

  it('should evaluate BigInt', () => {
    assert.throws(() => e.sync('BigInt(2)'), TypeError);
    assert.deepEqual(e.sync('BigInt(2)', {}, opts), undefined);
    assert.deepEqual(e.sync('BigInt(2)', { BigInt }, opts), 2n);
    assert.deepEqual(e.sync('BigInt(2 ** 54) * -1n', { BigInt }, opts), -18014398509481984n);
  });

  it('should evaluate Boolean', () => {
    assert.throws(() => e.sync('Boolean(1)'), TypeError);
    assert.deepEqual(e.sync('Boolean(1)', {}, opts), undefined);
    assert.deepEqual(e.sync('Boolean(1)', { Boolean }, opts), true);
    assert.deepEqual(e.sync('Boolean(0)', { Boolean }, opts), false);
  });

  it('should evaluate Date', () => {
    assert.deepEqual(e.sync('Date.now()', {}, opts), undefined);
    assert.deepEqual(e.sync('Date.now()', { Date }, opts), Date.now());
    assert.deepEqual(e.sync('new Date()', { Date }, opts), new Date());
  });

  it('should evaluate Number', () => {
    assert.deepEqual(e.sync('Number(1)', {}, opts), undefined);
    assert.deepEqual(e.sync('Number(1)', { Number }, opts), 1);
  });

  it('should evaluate parseInt', () => {
    assert.deepEqual(e.sync('parseInt("1.1b", 10)', {}, opts), undefined);
    assert.deepEqual(e.sync('parseInt("1.1b", 10)', { parseInt }, opts), 1);
    assert.deepEqual(e.sync('parseInt("1.0b", 10)', { parseInt }, opts), 1);
  });

  it('should evaluate parseFloat', () => {
    assert.deepEqual(e.sync('parseFloat("1.1b", 10)', {}, opts), undefined);
    assert.deepEqual(e.sync('parseFloat("1.1b", 10)', { parseFloat }, opts), 1.1);
    assert.deepEqual(e.sync('parseFloat("1.0b", 10)', { parseFloat }, opts), 1);
  });

  it('should evaluate RegExp', () => {
    assert.deepEqual(e.sync('new RegExp("^[abc]$", "gi")', {}, opts), undefined);
    assert.deepEqual(e.sync('new RegExp("^[abc]$", "gi")', { RegExp }, opts), /^[abc]$/gi);
  });

  it('should evaluate String', () => {
    assert.deepEqual(e.sync('String(1)', {}, opts), undefined);
    assert.deepEqual(e.sync('String(1)', { String }, opts), '1');
  });

  it('should evaluate Symbol literals (but why do this?)', () => {
    assert.deepEqual((e.sync('Symbol(1)', { Symbol }, opts)).toString(), Symbol('1').toString());
  });
});
