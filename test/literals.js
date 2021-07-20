'use strict';

const assert = require('assert').strict;
const { evaluate: e } = require('..');

describe('literals', () => {
  it('should evaluate object literals', () => {
    assert.deepEqual(e('{ a: "b" }'), { a: 'b' });
    assert.deepEqual(e('{ a: { b: { c: "d" } } }'), { a: { b: { c: 'd' } } });
    assert.deepEqual(e('{ a: ["b"] }'), { a: ['b'] });
  });

  it('should evaluate array literals', () => {
    assert.deepEqual(e('[1, 2, 3]'), [1, 2, 3]);
    assert.deepEqual(e('[{ a: "b" }]'), [{ a: 'b' }]);
  });

  it('should evaluate spread syntax', () => {
    assert.deepEqual(e('[1, 2, 3, ...arr]', { arr: [4, 5, 6] }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(e('[1, 2, 3, arr]', { arr: [4, 5, 6] }), [1, 2, 3, [4, 5, 6]]);
    assert.deepEqual(e('{ a: "b", ...c }', { c: { d: 'e', f: 'g' } }), { a: 'b', d: 'e', f: 'g' });
  });

  it('should evaluate numeric literals', () => {
    assert.equal(e('1 === 2'), false);
    assert.equal(e('1 == 2'), false);

    assert.equal(e('1 !== 2'), true);
    assert.equal(e('1 != 2'), true);

    assert.equal(e('1 === 1'), true);
    assert.equal(e('1 == 1'), true);

    assert.equal(e('1 !== 1'), false);
    assert.equal(e('1 != 1'), false);
  });

  it('should evaluate string literals', () => {
    assert.equal(e('"one" === "two"'), false);
    assert.equal(e('"one" == "two"'), false);

    assert.equal(e('"" === ""'), true);
    assert.equal(e('"" == ""'), true);

    assert.equal(e('"one" !== "two"'), true);
    assert.equal(e('"one" != "two"'), true);
  });

  it('should evaluate template literals', () => {
    assert.equal(e('`${a} ${foo} after`', { a: 'before', foo: 'middle' }), 'before middle after');
  });

  it('should evaluate regex literals', () => {
    assert.deepEqual(e('/ab+c/i'), /ab+c/i);
    assert.deepEqual(e('/^ab+c$/ig'), /^ab+c$/ig);
  });
});
