'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');

describe('literals', () => {
  it('should evaluate array literals', () => {
    assert.deepEqual(e.sync('[1, 2, 3]'), [1, 2, 3]);
    assert.deepEqual(e.sync('[{ a: "b" }]'), [{ a: 'b' }]);
  });

  it('should evaluate BigInt literals', () => {
    assert.equal(e.sync('1n'), 1n);
    assert.equal(e.sync('0x1fffffffffffffn'), 9007199254740991n);
    assert.equal(e.sync('0o377777777777777777n'), 9007199254740991n);
    assert.equal(e.sync('0b11111111111111111111111111111111111111111111111111111n'), 9007199254740991n);
    assert.equal(e.sync('2n * -1n'), -2n);
    assert.equal(e.sync('2n ** 54n'), 18014398509481984n);
    assert.equal(e.sync('(2n ** 54n) * -1n'), -18014398509481984n);
  });

  it('should evaluate numeric literals', () => {
    assert.equal(e.sync('1'), 1);
    assert.equal(e.sync('2e3'), 2e3);
    assert.equal(e.sync('2.1'), 2.1);
    assert.equal(e.sync('2.1e2'), 210);
    assert.equal(e.sync('-2.1e2'), -210);
  });

  it('should evaluate object literals', () => {
    assert.deepEqual(e.sync('{ a: "b" }'), { a: 'b' });
    assert.deepEqual(e.sync('{ a: { b: { c: "d" } } }'), { a: { b: { c: 'd' } } });
    assert.deepEqual(e.sync('{ a: ["b"] }'), { a: ['b'] });
  });

  it('should evaluate regex literals', () => {
    assert.deepEqual(e.sync('/ab+c/i'), /ab+c/i);
    assert.deepEqual(e.sync('/^ab+c$/ig'), /^ab+c$/ig);
  });

  it('should evaluate string literals', () => {
    assert.equal(e.sync('"one"'), 'one');
    assert.equal(e.sync('"two"'), 'two');
    assert.equal(e.sync('"it\'s a sentence"'), 'it\'s a sentence');
  });

  it('should evaluate template literals', () => {
    assert.equal(e.sync('`${a} ${foo} after`', { a: 'before', foo: 'middle' }), 'before middle after');
  });

  it('should evaluate spread syntax', () => {
    assert.deepEqual(e.sync('[1, 2, 3, ...arr]', { arr: [4, 5, 6] }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(e.sync('[1, 2, 3, arr]', { arr: [4, 5, 6] }), [1, 2, 3, [4, 5, 6]]);
    assert.deepEqual(e.sync('{ a: "b", ...c }', { c: { d: 'e', f: 'g' } }), { a: 'b', d: 'e', f: 'g' });
  });
});
