'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');
const { generate } = require('escodegen');

const opts = { functions: true, generate, strict: false };

describe('loops', () => {
  describe('for loop', () => {
    it.skip('should evaluate "for" loops', () => {
      assert.deepEqual(e.sync('for (let i = 0; i < 10; i++) { a[i] = i }', { a: [] }, opts), { a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] });
    });
  });
});
