'use strict';

const { strict: assert } = require('assert');
const { evaluate } = require('../support');

const e = (input, context, options) => evaluate(input, context, { ...options });

describe('budget (async)', () => {
  it('should allow simple expression within budget', async () => {
    assert.equal(await e('1', {}, { budget: 1 }), 1);
  });

  it('should reject when budget is exceeded on binary expression', async () => {
    await assert.rejects(() => e('1 + 2', {}, { budget: 2 }), /Expression complexity budget exceeded/);
  });

  it('should reject when budget is exceeded on array expression', async () => {
    // Visits: ArrayExpression + 3 NumericLiterals = 4 visits
    await assert.rejects(() => e('[1,2,3]', {}, { budget: 3 }), /Expression complexity budget exceeded/);
  });
});

