'use strict';

const assert = require('assert/strict');
const { evaluate: e } = require('../support');

const opts = { functions: true };

describe('built in objects', () => {
  it('should evaluate Array', async () => {
    const ctx = { Array };
    assert.deepEqual(await e('new Array("1", ...arr)', { Array, arr: ['a', 'b'] }, opts), ['1', 'a', 'b']);
    assert.deepEqual(await e('new Array("1")', ctx, opts), ['1']);
    assert.deepEqual(await e('Array("1")', ctx, opts), ['1']);
  });

  it('should evaluate BigInt', async () => {
    assert.deepEqual(await e('BigInt(2)', { BigInt }, opts), 2n);
    assert.deepEqual(await e('BigInt(2 ** 54) * -1n', { BigInt }, opts), -18014398509481984n);
  });

  it('should evaluate Boolean', async () => {
    assert.deepEqual(await e('Boolean(1)', { Boolean }, opts), true);
    assert.deepEqual(await e('Boolean(0)', { Boolean }, opts), false);
  });

  it('should evaluate Date', async () => {
    assert.deepEqual(await e('Date.now()', { Date }, opts), Date.now());
  });

  it('should evaluate Number', async () => {
    assert.deepEqual(await e('Number(1)', { Number }, opts), 1);
  });

  it('should evaluate parseFloat', async () => {
    assert.deepEqual(await e('parseFloat("1.1b")', { parseFloat }, opts), 1.1);
    assert.deepEqual(await e('parseFloat("1.0b")', { parseFloat }, opts), 1);
  });

  it('should evaluate RegExp', async () => {
    assert.deepEqual(await e('new RegExp("^[abc]$", "gi")', { RegExp }, opts), /^[abc]$/gi);
  });

  it('should evaluate String', async () => {
    assert.deepEqual(await e('String(1)', { String }, opts), '1');
  });

  it('should evaluate Symbol literals', async () => {
    assert.deepEqual((await e('Symbol(1)', { Symbol }, opts)).toString(), Symbol('1').toString());
  });
});
