'use strict';

const babel = require('@babel/parser');
// const Lexer = require('../lib/Lexer');
const ExpressionSync = require('../../lib/ExpressionSync');
const { evaluate, variables } = require('../..');

exports.parse = (source, options = {}) => {
  if (typeof source === 'string') {
    if (source?.trim().startsWith('for ')) {
      const ast = babel.parse(source, { ...options });
      return ast.program.body[0];
    }

    const ast = babel.parseExpression(source, { ...options });
    return ast;
  }

  return source;
};

exports.expression = (input, options = {}) => {
  const ast = exports.parse(input, options);
  return context => evaluate(ast, context, options);
};

exports.expression.sync = (input, options = {}) => {
  const ast = exports.parse(input, options);
  return context => {
    const expression = new ExpressionSync(ast, options);
    return expression.evaluate(context);
  };
};

exports.evaluate = (input, context = {}, options = {}) => {
  const ast = exports.parse(input, options);
  return evaluate(ast, context, options);
};

exports.variables = (input, options = {}) => {
  const ast = exports.parse(input, options);
  return variables(ast, options);
};

exports.evaluate.sync = (input, context = {}, options = {}) => {
  const ast = exports.parse(input, options);
  return evaluate.sync(ast, context, options);
};
