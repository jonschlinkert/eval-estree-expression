'use strict';

const assert = require('node:assert/strict');
const { parse } = require('esprima');
const { evaluate } = require('../..');

/**
 * Tests from static-eval library
 * Licensed under the MIT License.
 * Copyright (c) 2013 James Halliday
 */

const opts = { functions: true, strict: true };

describe('function property', () => {
  it('should eval function properties', () => {
    const src = '[1,2,3+4*10+n,beep.boop(3+5),obj[""+"x"].y]';
    const ast = parse(src).body[0].expression;
    const ctx = {
      n: 6,
      beep: { boop: function(x) { return x * 100; } },
      obj: { x: { y: 555 } }
    };
    const res = evaluate.sync(ast, ctx, opts);
    assert.deepEqual(res, [ 1, 2, 49, 800, 555 ]);
  });
});
