'use strict';

const { defineProperty } = Reflect;

const replacements = { is: '===', isnt: '!==', 'is not': '!==', not: '!==' };
const ALLOWED_OPERATORS = new Set(['is', 'isnt', 'is not', 'not']);
const UNSAFE_KEYS = new Set(['constructor', 'prototype', '__proto__']);

exports.isSafeKey = k => UNSAFE_KEYS.has(k) === false;
exports.isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
exports.isEmpty = v => v === undefined || v === null || (Array.isArray(v) && v.length === 0);
exports.define = (obj, key, value) => defineProperty(obj, key, { value, enumerable: false });
exports.inspect = require('./inspect');

exports.replaceOperators = (input, operators = []) => {
  const ops = new Set([].concat(operators));
  if (ops.has('is') && ops.has('not')) ops.add('is not');

  return input.replace(/(?: (is(?! not)|(?:is ?)?not|isnt) )/, (match, $1) => {
    return ALLOWED_OPERATORS.has($1) && ops.has($1) ? ` ${replacements[$1].trim()} ` : match;
  });
};
