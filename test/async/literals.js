'use strict';

const assert = require('assert').strict;
const { evaluate: e } = require('../..');

describe('literals', () => {
  it('should evaluate object literals', async () => {
    assert.deepEqual(await e('{ a: "b" }'), { a: 'b' });
    assert.deepEqual(await e('{ a: { b: { c: "d" } } }'), { a: { b: { c: 'd' } } });
    assert.deepEqual(await e('{ a: ["b"] }'), { a: ['b'] });
  });

  it('should evaluate array literals', async () => {
    assert.deepEqual(await e('[1, 2, 3]'), [1, 2, 3]);
    assert.deepEqual(await e('[{ a: "b" }]'), [{ a: 'b' }]);
  });

  it('should evaluate spread syntax', async () => {
    assert.deepEqual(await e('[1, 2, 3, ...arr]', { arr: [4, 5, 6] }), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(await e('[1, 2, 3, arr]', { arr: [4, 5, 6] }), [1, 2, 3, [4, 5, 6]]);
    assert.deepEqual(await e('{ a: "b", ...c }', { c: { d: 'e', f: 'g' } }), { a: 'b', d: 'e', f: 'g' });
  });

  it('should evaluate numeric literals', async () => {
    assert.equal(await e('1 === 2'), false);
    assert.equal(await e('1 == 2'), false);

    assert.equal(await e('1 !== 2'), true);
    assert.equal(await e('1 != 2'), true);

    assert.equal(await e('1 === 1'), true);
    assert.equal(await e('1 == 1'), true);

    assert.equal(await e('1 !== 1'), false);
    assert.equal(await e('1 != 1'), false);
  });

  it('should evaluate string literals', async () => {
    assert.equal(await e('"one" === "two"'), false);
    assert.equal(await e('"one" == "two"'), false);

    assert.equal(await e('"" === ""'), true);
    assert.equal(await e('"" == ""'), true);

    assert.equal(await e('"one" !== "two"'), true);
    assert.equal(await e('"one" != "two"'), true);
  });

  it('should evaluate template literals', async () => {
    assert.equal(await e('`${a} ${foo} after`', { a: 'before', foo: 'middle' }), 'before middle after');
  });

  it('should evaluate regex literals', async () => {
    assert.deepEqual(await e('/ab+c/i'), /ab+c/i);
    assert.deepEqual(await e('/^ab+c$/ig'), /^ab+c$/ig);
  });
});
