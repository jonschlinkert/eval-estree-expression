'use strict';

const assert = require('node:assert/strict');
const Context = require('../support/Context');
const { evaluate } = require('../support');
const { generate } = require('escodegen');

const opts = {
  functions: true,
  generate,
  generator: 'escodegen',
  strict: false,
  allowAwaitOutsideFunction: true,
  prefix: '__data'
};

const e = (input, context, options) => {
  return evaluate(input, context, { ...opts, ...options });
};

describe('context', () => {
  it('should support Context instance', async () => {
    const context = new Context({ Array, p: 'item_', numbers: [1, 2, 3], count: 2 }, { prefix: '__data' });

    assert.deepEqual(
      await e('Array.from({ length: count }, (_, i) => p + (i + 4))', context),
      ['item_4', 'item_5']
    );

    assert.deepEqual(
      await e('Array.from({ length: count }, (_, i) => ({ p }))', context),
      [{ p: 'item_' }, { p: 'item_' }]
    );

    assert.deepEqual(
      await e('Array.from({ length: count }, (_, i) => ({ p, index: i }))', context),
      [{ p: 'item_', index: 0 }, { p: 'item_', index: 1 }]
    );

    assert.deepEqual(
      await e('Array.from({ length: count }, (_, i) => ({ p, index: i, value: numbers[i] }))', context),
      [{ p: 'item_', index: 0, value: 1 }, { p: 'item_', index: 1, value: 2 }]
    );
  });

  it('nested context', async () => {
    const data = { Array, numbers: [1, 2, 3], count: 2 };
    const context = new Context({ p: 'item_' }, { prefix: '__data' });
    const childContext = new Context(data, { prefix: '__data' }, context);

    assert.deepEqual(
      await e('Array.from({ length: count }, (_, i) => p + (i + 4))', childContext),
      ['item_4', 'item_5']
    );
  });
});
