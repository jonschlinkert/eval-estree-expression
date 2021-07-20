'use strict';

const assert = require('assert').strict;
const { evaluate: e } = require('../..');

describe('literals', () => {
  it('should evaluate object literals', () => {
    assert.deepEqual(e.sync('{ a: "b" }'), { a: 'b' });
    assert.deepEqual(e.sync('{ a: { b: { c: "d" } } }'), { a: { b: { c: 'd' } } });
    assert.deepEqual(e.sync('{ a: ["b"] }'), { a: ['b'] });
  });

  it('should evaluate array literals', () => {
    assert.deepEqual(e.sync('[1, 2, 3]'), [1, 2, 3]);
    assert.deepEqual(e.sync('[{ a: "b" }]'), [{ a: 'b' }]);
  });

  it('should evaluate spread syntax', () => {
    assert.deepEqual(e.sync('[1, 2, 3, ...arr]', { arr: [4, 5, 6] }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(e.sync('[1, 2, 3, arr]', { arr: [4, 5, 6] }), [1, 2, 3, [4, 5, 6]]);
    assert.deepEqual(e.sync('{ a: "b", ...c }', { c: { d: 'e', f: 'g' } }), { a: 'b', d: 'e', f: 'g' });
  });

  it('should evaluate numeric literals', () => {
    assert.equal(e.sync('1'), 1);
    assert.equal(e.sync('2e3'), 2e3);
    assert.equal(e.sync('2.1'), 2.1);
    assert.equal(e.sync('2.1e2'), 210);
    assert.equal(e.sync('-2.1e2'), -210);
  });

  it('should evaluate string literals', () => {
    assert.equal(e.sync('"one"'), 'one');
    assert.equal(e.sync('"two"'), 'two');
    assert.equal(e.sync('"it\'s a sentence"'), 'it\'s a sentence');
  });

  it('should evaluate template literals', () => {
    assert.equal(e.sync('`${a} ${foo} after`', { a: 'before', foo: 'middle' }), 'before middle after');
  });

  it('should evaluate regex literals', () => {
    assert.deepEqual(e.sync('/ab+c/i'), /ab+c/i);
    assert.deepEqual(e.sync('/^ab+c$/ig'), /^ab+c$/ig);
  });
});
