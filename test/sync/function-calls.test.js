'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');

describe('function calls', () => {
  it('should support regex.test()', () => {
    assert.deepEqual(e.sync('/./.test("a")', {}, { functions: true }), true);
  });

  it('should support regex.test()', () => {
    assert.deepEqual(e.sync('a.upper("b")', { a: { upper: v => v.toUpperCase() } }, { functions: true }), 'B');
  });

  it('should support regex.exec()', () => {
    assert.deepEqual(e.sync('/./.exec("abc")', {}, { functions: true }).slice(), ['a']);
  });

  it('should support [].slice()', () => {
    assert.deepEqual(e.sync('[1, 2, 3, 4, 5].slice(1, 3)', {}, { functions: true }).slice(), [2, 3]);
  });
});
