'use strict';

const babel = require('@babel/parser');
// const Lexer = require('../lib/Lexer');
const ExpressionSync = require('../../lib/ExpressionSync');
const { evaluate, variables } = require('../..');

exports.parse = (source, options = {}) => {
  if (typeof source === 'string') {
    const opts = { ...options };
    // const input = (opts.notExpression || opts.booleanLogicalOperators)
    //   ? Lexer.toString(source)
    //   : source;

    const input = source;
    const ast = babel.parseExpression(input, opts);
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
