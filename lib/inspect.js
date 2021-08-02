'use strict';

const util = require('util');
const { define, isEmpty, isObject } = require('./utils');

const prune = obj => {
  const node = {};

  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(v => prune(v));
  for (const [k, v] of Object.entries(obj)) {
    if (isEmpty(v)) continue;
    if (Array.isArray(v)) {
      node[k] = v.map(prune);
    } else if (isObject(v)) {
      node[k] = prune(v);
    } else {
      node[k] = v;
    }
    if (['loc', 'start', 'end'].includes(k)) {
      define(node, k, v);
    }
  }

  if (obj?.constructor) {
    Object.setPrototypeOf(node, Object.getPrototypeOf(obj));
  }

  return node;
};

module.exports = (value, options) => {
  return util.inspect(prune(value), { depth: null, colors: true, ...options });
};
