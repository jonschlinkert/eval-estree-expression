'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');

describe('function calls', () => {
  it('should support regex.test()', async () => {
    assert.deepEqual(await e('/./.test("a")', {}, { functions: true }), true);
  });

  it('should support regex.test()', async () => {
    assert.deepEqual(await e('a.upper("b")', { a: { upper: v => v.toUpperCase() } }, { functions: true }), 'B');
  });

  it('should support regex.exec()', async () => {
    assert.deepEqual((await e('/./.exec("abc")', {}, { functions: true })).slice(), ['a']);
  });

  it('should support [].slice()', async () => {
    assert.deepEqual((await e('[1, 2, 3, 4, 5].slice(1, 3)', {}, { functions: true })).slice(), [2, 3]);
  });
});
