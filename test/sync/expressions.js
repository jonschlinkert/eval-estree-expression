'use strict';

const assert = require('assert').strict;
const { evaluate } = require('../support');
const { generate } = require('escodegen');

const opts = { functions: true, generate, strict: false };

describe('expressions', () => {
  describe('ObjectExpression', () => {
    it('should evaluate object expressions', () => {
      assert.deepEqual(evaluate.sync('{ a }', { a: 2 }, opts), { a: 2 });
      assert.deepEqual(evaluate.sync('({ a })', { a: 2 }, opts), { a: 2 });
      assert.deepEqual(evaluate.sync('{ a, b: b() }', { a: 2, b: () => 6 }, opts), { a: 2, b: 6 });
    });

    it('should return undefined when object expressions are invalid', () => {
      assert.deepEqual(evaluate.sync('{ a: b }', { a: 2 }, opts), undefined);
    });

    it('should support computed properties', async () => {
      assert.deepEqual(await evaluate('({ [a]: a })', { a: 'x' }, opts), { x: 'x' });
      assert.deepEqual(await evaluate('({ [a]: b })', { a: 'x', b: 'y' }, opts), { x: 'y' });
      assert.deepEqual(evaluate.sync('({ [a]: b })', { a: 'x', b: 'y' }, opts), { x: 'y' });
    });
  });

  describe('ArrayExpression', () => {
    it('should evaluate array expressions', () => {
      assert.deepEqual(evaluate.sync('[a, b()]', { a: 2, b: () => 6 }, opts), [2, 6]);
    });

    it('should return undefined when array expressions are invalid', () => {
      assert.deepEqual(evaluate.sync('[a, b]', { a: 2 }, opts), undefined);
    });
  });

  describe('ArrowFunctionExpression', () => {
    it('array methods with fat arrow function', () => {
      assert.deepEqual(evaluate.sync('[1, 2, 3].map((n) => { return n * x })', { x: 2 }, opts), [2, 4, 6]);
      assert.deepEqual(evaluate.sync('[1, 2, 3].map(n => n * x)', { x: 2 }, opts), [2, 4, 6]);
    });

    it('immediately invoked fat arrow', () => {
      assert.deepEqual(evaluate.sync('((a, b, c) => a + b + c)(x, y, z) ', { x: 1, y: 2, z: 3 }, opts), 6);
    });

    it('immediately invoked fat arrow with function args', () => {
      assert.deepEqual(evaluate.sync('((a, b, c) => a + b + c)(x, y, z(zz)) ', { x: 1, y: 2, z: v => v, zz: 3 }, opts), 6);
    });
  });

  describe('AwaitExpression', () => {
    it('async await', async () => {
      const ctx = { x: Promise.resolve(1), y: Promise.resolve(2), z: Promise.resolve(3) };
      assert.deepEqual(await evaluate('(async (a, b, c) => await a + await b + await c)(x, y, z) ', ctx, opts), 6);
    });
  });
});
