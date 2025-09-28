'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');
const { generate } = require('escodegen');

const opts = { functions: true, generate, strict: false, allowAwaitOutsideFunction: true };

describe('expressions', () => {
  describe('ObjectExpression', () => {
    it('should evaluate object expressions', async () => {
      assert.deepEqual(await e('{ a }', { a: 2 }, opts), { a: 2 });
      assert.deepEqual(await e('({ a })', { a: 2 }, opts), { a: 2 });
      assert.deepEqual(await e('{ a, b: b() }', { a: 2, b: () => 6 }, opts), { a: 2, b: 6 });
    });

    it('should return undefined when object expressions are invalid', async () => {
      assert.deepEqual(await e('{ a: b }', { a: 2 }, opts), undefined);
    });

    it('should support computed properties', async () => {
      assert.deepEqual(await e('({ [a]: a })', { a: 'x' }, opts), { x: 'x' });
      assert.deepEqual(await e('({ [a]: b })', { a: 'x', b: 'y' }, opts), { x: 'y' });
      assert.deepEqual(await e('({ [a]: b })', { a: 'x', b: 'y' }, opts), { x: 'y' });
    });
  });

  describe('ArrayExpression', () => {
    it('should evaluate array expressions', async () => {
      assert.deepEqual(await e('[a, b()]', { a: 2, b: () => 6 }, opts), [2, 6]);
    });

    it('should return undefined when array expressions are invalid', async () => {
      assert.deepEqual(await e('[a, b]', { a: 2 }, opts), undefined);
    });
  });

  describe('ArrowFunctionExpression', () => {
    it('array methods with fat arrow function', async () => {
      assert.deepEqual(await e('[1, 2, 3].map((n) => { return n * x })', { x: 2 }, opts), [2, 4, 6]);
      assert.deepEqual(await e('[1, 2, 3].map(n => n * x)', { x: 2 }, opts), [2, 4, 6]);
    });

    it('immediately invoked fat arrow', async () => {
      assert.deepEqual(await e('((a, b, c) => a + b + c)(x, y, z) ', { x: 1, y: 2, z: 3 }, opts), 6);
    });

    it('immediately invoked fat arrow with function args', async () => {
      assert.deepEqual(await e('((a, b, c) => a + b + c)(x, y, z(zz)) ', { x: 1, y: 2, z: v => v, zz: 3 }, opts), 6);
    });

    it('nested arrow functions', async () => {
      assert.deepEqual(await e('states.filter(n => n !== "final")', { Object, states: ['a', 'b', 'final'] }, opts), ['a', 'b']);

      assert.deepEqual(await e('Object.keys(states)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k !== "c")', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b']);

      assert.deepEqual(await e('k.startsWith("f")', { k: 'a' }, opts), false);
      assert.deepEqual(await e('k.startsWith("f")', { k: 'f' }, opts), true);
      assert.deepEqual(await e('!k.startsWith("f")', { k: 'a' }, opts), true);
      assert.deepEqual(await e('!k.startsWith("f")', { k: 'f' }, opts), false);
      assert.deepEqual(await e('!!k.startsWith("f")', { k: 'f' }, opts), true);
      assert.deepEqual(await e('!!!k.startsWith("f")', { k: 'f' }, opts), false);
      assert.deepEqual(await e('!Boolean(k.startsWith("f"))', { k: 'f', Boolean }, opts), false);

      assert.deepEqual(await e('Object.keys(states).map(k => k)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(await e('Object.keys(states).map(k => k + k)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['aa', 'bb', 'cc']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k != "d")', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4 }
      }, opts), ['a', 'b', 'c']);

      // assert.deepEqual(await e('Object.keys(states.__proto__).filter(k => k != "d")', {
      //   Object,
      //   states: { a: 1, b: 2, c: 3, d: 4 }
      // }, opts), ['a', 'b', 'c']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k !== "c" && k !== "d")', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4 }
      }, opts), ['a', 'b']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k)', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4, _f: 5 }
      }, opts), ['a', 'b', 'c', 'd', '_f']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k.startsWith("_f"))', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4, _f: 5 }
      }, opts), ['_f']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k !== "c" && !k.startsWith("_f"))', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4, _f: 5 }
      }, opts), ['a', 'b', 'd']);

      assert.deepEqual(await e('Object.keys(states).filter(k => k !== "c" && !k.startsWith("_f"))', {
        Object,
        states: { a: 1, b: 2, c: 3, _f: 4 }
      }, opts), ['a', 'b']);
    });
  });

  describe('OptionalCallExpression', () => {
    it('should evaluate optional call expressions', async () => {
      assert.deepEqual(await e('a?.()', { a: () => 2 }, opts), 2);
      assert.deepEqual(await e('a?.()', {}, opts), undefined);
      assert.deepEqual(await e('a?.b?.()', { a: { b: () => 2 } }, opts), 2);
      assert.deepEqual(await e('a?.b?.()', { a: {} }, opts), undefined);
    });
  });

  describe('AwaitExpression', () => {
    it('async await', async () => {
      const ctx = { x: Promise.resolve(1), y: Promise.resolve(2), z: Promise.resolve(3) };
      assert.deepEqual(await await e('(async (a, b, c) => await a + await b + await c)(x, y, z) ', ctx, opts), 6);
    });
  });
});
