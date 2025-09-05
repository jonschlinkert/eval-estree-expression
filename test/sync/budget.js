'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');

describe('budget (sync)', () => {
  it('should allow simple expression within budget', () => {
    assert.equal(e.sync('1', {}, { budget: 1 }), 1);
  });

  it('should throw when budget is exceeded on binary expression', () => {
    assert.throws(() => e.sync('1 + 2', {}, { budget: 2 }), /Expression complexity budget exceeded/);
  });

  it('should throw when budget is exceeded on array expression', () => {
    // Visits: ArrayExpression + 3 NumericLiterals = 4 visits
    assert.throws(() => e.sync('[1,2,3]', {}, { budget: 3 }), /Expression complexity budget exceeded/);
  });
});

