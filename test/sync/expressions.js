'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');
const { generate } = require('escodegen');

const opts = { functions: true, generate, strict: false };

describe('expressions', () => {
  describe('ObjectExpression', () => {
    it('should evaluate object expressions', () => {
      assert.deepEqual(e.sync('{ a }', { a: 2 }, opts), { a: 2 });
      assert.deepEqual(e.sync('({ a })', { a: 2 }, opts), { a: 2 });
      assert.deepEqual(e.sync('{ a, b: b() }', { a: 2, b: () => 6 }, opts), { a: 2, b: 6 });
    });

    it('should return undefined when object expressions are invalid', () => {
      assert.deepEqual(e.sync('{ a: b }', { a: 2 }, opts), undefined);
    });

    it('should support computed properties', async () => {
      assert.deepEqual(await e('({ [a]: a })', { a: 'x' }, opts), { x: 'x' });
      assert.deepEqual(await e('({ [a]: b })', { a: 'x', b: 'y' }, opts), { x: 'y' });
      assert.deepEqual(e.sync('({ [a]: b })', { a: 'x', b: 'y' }, opts), { x: 'y' });
    });
  });

  describe('ArrayExpression', () => {
    it('should evaluate array expressions', () => {
      assert.deepEqual(e.sync('[a, b()]', { a: 2, b: () => 6 }, opts), [2, 6]);
    });

    it('should return undefined when array expressions are invalid', () => {
      assert.deepEqual(e.sync('[a, b]', { a: 2 }, opts), undefined);
    });
  });

  describe('ArrowFunctionExpression', () => {
    it('array methods with fat arrow function', () => {
      assert.deepEqual(e.sync('[1, 2, 3].map((n) => { return n * x })', { x: 2 }, opts), [2, 4, 6]);
      assert.deepEqual(e.sync('[1, 2, 3].map(n => n * x)', { x: 2 }, opts), [2, 4, 6]);
    });

    it('immediately invoked fat arrow', () => {
      assert.deepEqual(e.sync('((a, b, c) => a + b + c)(x, y, z) ', { x: 1, y: 2, z: 3 }, opts), 6);
    });

    it('immediately invoked fat arrow with function args', () => {
      assert.deepEqual(e.sync('((a, b, c) => a + b + c)(x, y, z(zz)) ', { x: 1, y: 2, z: v => v, zz: 3 }, opts), 6);
    });

    it('nested arrow functions',  () => {
      assert.deepEqual(e.sync('states.filter(n => n !== "final")', { Object, states: ['a', 'b', 'final'] }, opts), ['a', 'b']);

      assert.deepEqual(e.sync('Object.keys(states)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k !== "c")', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b']);

      assert.deepEqual(e.sync('k.startsWith("f")', { k: 'a' }, opts), false);
      assert.deepEqual(e.sync('k.startsWith("f")', { k: 'f' }, opts), true);
      assert.deepEqual(e.sync('!k.startsWith("f")', { k: 'a' }, opts), true);
      assert.deepEqual(e.sync('!k.startsWith("f")', { k: 'f' }, opts), false);
      assert.deepEqual(e.sync('!!k.startsWith("f")', { k: 'f' }, opts), true);
      assert.deepEqual(e.sync('!!!k.startsWith("f")', { k: 'f' }, opts), false);
      assert.deepEqual(e.sync('!Boolean(k.startsWith("f"))', { k: 'f', Boolean }, opts), false);

      assert.deepEqual(e.sync('Object.keys(states).map(k => k)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(e.sync('Object.keys(states).map(k => k + k)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['aa', 'bb', 'cc']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k)', {
        Object,
        states: { a: 1, b: 2, c: 3 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k != "d")', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4 }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k !== "c" && k !== "d")', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4 }
      }, opts), ['a', 'b']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k)', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4, _f: 5 }
      }, opts), ['a', 'b', 'c', 'd', '_f']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k.startsWith("_f"))', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4, _f: 5 }
      }, opts), ['_f']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k !== "c" && !k.startsWith("_f"))', {
        Object,
        states: { a: 1, b: 2, c: 3, d: 4, _f: 5 }
      }, opts), ['a', 'b', 'd']);

      assert.deepEqual(e.sync('Object.keys(states).filter(k => k !== "c" && !k.startsWith("_f"))', {
        Object,
        states: { a: 1, b: 2, c: 3, _f: 4 }
      }, opts), ['a', 'b']);

      assert.deepEqual(e.sync('Object.values(states).filter(s => s.name !== "c")', {
        Object,
        states: { a: { name: 'a' }, b: { name: 'b' }, c: { name: 'c' }, _f: { name: 'f' } }
      }, opts), [{ name: 'a' }, { name: 'b' }, { name: 'f' }]);

      assert.deepEqual(e.sync('Object.values(states).map(s => s.name)', {
        Object,
        states: { a: { name: 'a' }, b: { name: 'b' }, c: { name: 'c' }, _f: { name: 'f' } }
      }, opts), ['a', 'b', 'c', 'f']);

      assert.deepEqual(e.sync('Object.values(states).map(s => s.name).filter(n => n !== "f")', {
        Object,
        states: { a: { name: 'a' }, b: { name: 'b' }, c: { name: 'c' }, _f: { name: 'f' } }
      }, opts), ['a', 'b', 'c']);

      assert.deepEqual(e.sync('Object.values(states).map(s => s.name).filter(n => !n.startsWith("f"))', {
        Object,
        states: { a: { name: 'a' }, b: { name: 'b' }, c: { name: 'c' }, _f: { name: 'foo' } }
      }, opts), ['a', 'b', 'c']);

      const states = { a: { name: 'a' }, b: { name: 'b' }, c: { name: 'c' }, _f: { name: 'foo' } };
      const expected = Object.values(states).filter(s => s.name !== 'c' && !s.name.startsWith('f'));

      const exp = 'Object.values(states).filter(s => s.name !== "c" && !s.name.startsWith("f"))';
      const actual = e.sync(exp, { Object, states }, opts);
      assert.deepEqual(actual, expected);
    });
  });

  describe('OptionalCallExpression', () => {
    it('should evaluate optional call expressions', () => {
      assert.deepEqual(e.sync('a?.()', { a: () => 2 }, opts), 2);
      assert.deepEqual(e.sync('a?.()', {}, opts), undefined);
      assert.deepEqual(e.sync('a?.b?.()', { a: { b: () => 2 } }, opts), 2);
      assert.deepEqual(e.sync('a?.b?.()', { a: {} }, opts), undefined);
    });
  });

  describe('AwaitExpression', () => {
    it('async await', async () => {
      const ctx = { x: Promise.resolve(1), y: Promise.resolve(2), z: Promise.resolve(3) };
      assert.deepEqual(await e('(async (a, b, c) => await a + await b + await c)(x, y, z) ', ctx, opts), 6);
    });
  });
});
