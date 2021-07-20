'use strict';

const util = require('util');
const { define, isEmpty, isObject } = require('./utils');

const prune = obj => {
  const res = {};

  for (const [k, v] of Object.entries(obj)) {
    if (isEmpty(v)) continue;
    if (Array.isArray(v)) {
      res[k] = v.map(prune);
    } else if (isObject(v)) {
      res[k] = prune(v);
    } else {
      res[k] = v;
    }
    if (['loc', 'start', 'end'].includes(k)) {
      define(res, k, v);
    }
  }

  if (obj?.constructor) {
    Object.setPrototypeOf(res, Object.getPrototypeOf(obj));
  }

  return res;
};

module.exports = (value, options) => {
  return util.inspect(prune(value), { depth: null, colors: true, ...options });
};
