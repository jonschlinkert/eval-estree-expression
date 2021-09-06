'use strict';

const assert = require('assert').strict;
const { evaluate } = require('../..');
const { parse } = require('esprima');

/**
 * Tests from static-eval library
 * Licensed under the MIT License.
 * Copyright (c) 2013 James Halliday
 */

const opts = { functions: true };

describe('template strings', () => {
  it('untagged template strings', () => {
    const src = '`${1},${2 + n},${`4,5`}`';
    const ast = parse(src).body[0].expression;
    const res = evaluate.sync(ast, { n: 6 }, opts);
    assert.deepEqual(res, '1,8,4,5');
  });

  it('tagged template strings', () => {
    const src = 'template`${1},${2 + n},${`4,5`}`';
    const ast = parse(src).body[0].expression;
    const ctx = {
      template: function(strings, ...values) {
        assert.deepEqual(strings, ['', ',', ',', '']);
        assert.deepEqual(values, [1, 8, '4,5']);
        return 'foo';
      },
      n: 6
    };

    const res = evaluate.sync(ast, ctx, opts);
    assert.deepEqual(res, 'foo');
  });

  it('async tagged template strings', async () => {
    const src = 'template`${1},${2 + n},${`4,5`}`';
    const ast = parse(src).body[0].expression;
    const ctx = {
      template: function(strings, ...values) {
        assert.deepEqual(strings, ['', ',', ',', '']);
        assert.deepEqual(values, [1, 8, '4,5']);
        return 'foo';
      },
      n: Promise.resolve(6)
    };

    const res = await evaluate(ast, ctx, opts);
    assert.deepEqual(res, 'foo');
  });
});
