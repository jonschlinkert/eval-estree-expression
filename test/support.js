'use strict';

const babel = require('@babel/parser');
const Lexer = require('../lib/Lexer');
const ExpressionSync = require('../lib/ExpressionSync');
const { evaluate } = require('..');

exports.parse = (source, options = {}) => {
  if (typeof source === 'string') {
    const opts = { ...options };
    const input = (opts.not_expression || opts.boolean_logical_operators) ? Lexer.toString(source) : source;
    const ast = babel.parseExpression(input, opts);
    return { input, ast, opts };
  }

  return { input: '', ast: source, opts: options };
};

exports.expression = (input, options = {}) => {
  const { ast, opts } = exports.parse(input, options);
  return context => evaluate(ast, context, opts);
};

exports.expression.sync = (input, options = {}) => {
  const { ast, opts } = exports.parse(input, options);
  return context => {
    const expression = new ExpressionSync(ast, opts);
    return expression.evaluate(context);
  };
};

exports.evaluate = (input, context = {}, options = {}) => {
  const { ast, opts } = exports.parse(input, options);
  return evaluate(ast, context, opts);
};

exports.evaluate.sync = (input, context = {}, options = {}) => {
  const { ast, opts } = exports.parse(input, options);
  return evaluate.sync(ast, context, opts);
};
