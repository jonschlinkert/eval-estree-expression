'use strict';

exports.FAIL = Symbol('fail');
exports.UNSAFE_KEYS = new Set(['constructor', 'prototype', '__proto__', '__defineGetter__']);
