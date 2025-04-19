'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');

describe('function calls', () => {
  describe('regex', () => {
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

  describe('string', () => {
    it('should support string.split()', async () => {
      assert.deepEqual((await e('"a,b,c".split(",")', {}, { functions: true })).slice(), ['a', 'b', 'c']);
    });

    it('should support string.replace()', async () => {
      assert.deepEqual((await e('"a,b,c".replace(/,/g, "-")', {}, { functions: true })).slice(), 'a-b-c');
    });

    it('should support string.indexOf()', async () => {
      assert.deepEqual((await e('"abc".indexOf("b")', {}, { functions: true })), 1);
    });

    it('should support string.lastIndexOf()', async () => {
      assert.deepEqual((await e('"abc".lastIndexOf("b")', {}, { functions: true })), 1);
    });

    it('should support string.includes()', async () => {
      assert.deepEqual((await e('"abc".includes("b")', {}, { functions: true })), true);
    });

    it('should support string.startsWith()', async () => {
      assert.deepEqual((await e('"abc".startsWith("a")', {}, { functions: true })), true);
    });
  });
});
