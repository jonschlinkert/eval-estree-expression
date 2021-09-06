'use strict';

const { defineProperty } = Reflect;
const UNSAFE_KEYS = new Set(['constructor', 'prototype', '__proto__', '__defineGetter__']);

exports.isSafeKey = k => UNSAFE_KEYS.has(k) === false;
exports.isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
exports.isEmpty = v => v === undefined || v === null || (Array.isArray(v) && v.length === 0);
exports.define = (obj, key, value) => defineProperty(obj, key, { value, enumerable: false });
