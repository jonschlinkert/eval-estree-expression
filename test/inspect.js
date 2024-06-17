'use strict';

const babel = require('@babel/parser');
const assert = require('assert').strict;
const inspect = require('./support/inspect');

describe('inspect', () => {
  it('should remove undefined values', () => {
    assert.equal(inspect(babel.parseExpression('1 + 1'), { colors: false }), `Node {
  type: 'BinaryExpression',
  left: Node {
    type: 'NumericLiteral',
    extra: { rawValue: 1, raw: '1' },
    value: 1
  },
  operator: '+',
  right: Node {
    type: 'NumericLiteral',
    extra: { rawValue: 1, raw: '1' },
    value: 1
  }
}`);
  });
});
