'use strict';

const { defineProperty } = Reflect;
const util = require('util');
const { isEmpty } = require('../lib/shared/utils');

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const define = (obj, key, value) => defineProperty(obj, key, { value, enumerable: false });

const prune = obj => {
  for (const [k, v] of Object.entries(obj)) {
    if (isEmpty(v)) {
      delete obj[k];
      continue;
    }

    if (Array.isArray(v)) {
      obj[k] = v.map(prune);
      continue;
    }

    if (isObject(v)) {
      obj[k] = prune(v);
    }

    if (['loc', 'start', 'end'].includes(k)) {
      define(obj, k, v);
      continue;
    }
  }
  return obj;
};

module.exports = (value, options) => {
  return util.inspect(prune(value), { depth: null, colors: true, ...options });
};
