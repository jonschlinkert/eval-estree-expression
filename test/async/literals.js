'use strict';

const assert = require('assert/strict');
const { evaluate: e } = require('../support');

describe('literals', () => {
  it('should evaluate array literals', async () => {
    assert.deepEqual(await e('[1, 2, 3]'), [1, 2, 3]);
    assert.deepEqual(await e('[{ a: "b" }]'), [{ a: 'b' }]);
  });

  it('should evaluate BigInt literals', async () => {
    assert.equal(await e('1n'), 1n);
    assert.equal(await e('0x1fffffffffffffn'), 9007199254740991n);
    assert.equal(await e('0o377777777777777777n'), 9007199254740991n);
    assert.equal(await e('0b11111111111111111111111111111111111111111111111111111n'), 9007199254740991n);
    assert.equal(await e('2n * -1n'), -2n);
    assert.equal(await e('2n ** 54n'), 18014398509481984n);
    assert.equal(await e('(2n ** 54n) * -1n'), -18014398509481984n);
  });

  it('should evaluate numeric literals', async () => {
    assert.equal(await e('1'), 1);
    assert.equal(await e('2e3'), 2e3);
    assert.equal(await e('2.1'), 2.1);
    assert.equal(await e('2.1e2'), 210);
    assert.equal(await e('-2.1e2'), -210);
  });

  it('should evaluate object literals', async () => {
    assert.deepEqual(await e('{ a: "b" }'), { a: 'b' });
    assert.deepEqual(await e('{ a: { b: { c: "d" } } }'), { a: { b: { c: 'd' } } });
    assert.deepEqual(await e('{ a: ["b"] }'), { a: ['b'] });
  });

  it('should evaluate regex literals', async () => {
    assert.deepEqual(await e('/ab+c/i'), /ab+c/i);
    assert.deepEqual(await e('/^ab+c$/ig'), /^ab+c$/ig);
  });

  it('should evaluate string literals', async () => {
    assert.equal(await e('"one"'), 'one');
    assert.equal(await e('"two"'), 'two');
    assert.equal(await e('"it\'s a sentence"'), 'it\'s a sentence');
  });

  it('should evaluate template literals', async () => {
    assert.equal(await e('`${a} ${foo} after`', { a: 'before', foo: 'middle' }), 'before middle after');
  });

  it('should evaluate spread syntax', async () => {
    assert.deepEqual(await e('[1, 2, 3, ...arr]', { arr: [4, 5, 6] }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(await e('[1, 2, 3, arr]', { arr: [4, 5, 6] }), [1, 2, 3, [4, 5, 6]]);
    assert.deepEqual(await e('{ a: "b", ...c }', { c: { d: 'e', f: 'g' } }), { a: 'b', d: 'e', f: 'g' });
  });
});
