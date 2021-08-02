// 'use strict';

// const assert = require('assert/strict');
// const { evaluate: e } = require('../support');

// const opts = { allow_functions: true, allow_builtin_objects: true };

// describe('built in objects', () => {
//   it('should evaluate Array', () => {
//     assert.deepEqual(e.sync('new Array("1", ...arr)', { arr: ['a', 'b'] }, opts), ['1', 'a', 'b']);
//     assert.deepEqual(e.sync('new Array("1")', {}, opts), ['1']);
//     assert.deepEqual(e.sync('Array("1")', {}, opts), ['1']);
//   });

//   it('should evaluate BigInt', () => {
//     assert.deepEqual(e.sync('BigInt(2)', {}, opts), 2n);
//     assert.deepEqual(e.sync('BigInt(2 ** 54) * -1n', {}, opts), -18014398509481984n);
//   });

//   it('should evaluate Boolean', () => {
//     assert.deepEqual(e.sync('Boolean(1)', {}, opts), true);
//     assert.deepEqual(e.sync('Boolean(0)', {}, { ...opts, allow_builtin_objects: ['Boolean'] }), false);
//   });

//   it('should evaluate Date', () => {
//     assert.deepEqual(e.sync('Date.now()', {}, opts), Date.now());
//   });

//   it('should evaluate Number', () => {
//     assert.deepEqual(e.sync('Number(1)', {}, opts), 1);
//   });

//   it('should evaluate parseFloat', () => {
//     assert.deepEqual(e.sync('parseFloat("1.1b")', {}, opts), 1.1);
//     assert.deepEqual(e.sync('parseFloat("1.0b")', {}, opts), 1);
//   });

//   it('should evaluate RegExp', () => {
//     assert.deepEqual(e.sync('new RegExp("^[abc]$", "gi")', {}, opts), /^[abc]$/gi);
//   });

//   it('should evaluate String', () => {
//     assert.deepEqual(e.sync('String(1)', {}, opts), '1');
//   });

//   it('should evaluate Symbol literals', () => {
//     assert.deepEqual((e.sync('Symbol(1)', {}, opts)).toString(), Symbol('1').toString());
//   });
// });
