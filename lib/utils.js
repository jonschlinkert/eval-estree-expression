'use strict';

const { defineProperty } = Reflect;

exports.UNSAFE_KEYS = new Set(['constructor', 'prototype', '__proto__']);
exports.isSafeKey = k => exports.UNSAFE_KEYS.has(k) === false;
exports.isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
exports.define = (obj, key, value) => defineProperty(obj, key, { value, enumerable: false });
exports.isEmpty = v => v === undefined || v === null || (Array.isArray(v) && v.length === 0);
