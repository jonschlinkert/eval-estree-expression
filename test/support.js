'use strict';

const babel = require('@babel/parser');
const { evaluate } = require('..');

exports.parse = (input, options = {}) => {
  return typeof input === 'string' ? babel.parseExpression(input, options) : input;
};

exports.evaluate = (input, context = {}, options = {}) => {
  return evaluate(exports.parse(input, options), context, options);
};

exports.evaluate.sync = (input, context = {}, options = {}) => {
  return evaluate.sync(exports.parse(input, options), context, options);
};
