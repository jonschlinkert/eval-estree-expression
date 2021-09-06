'use strict';

const start = Date.now();
process.on('exit', () => console.log(`Time: ${Date.now() - start}ms`));

const { evaluate: e } = require('../test/support');

console.log(e.sync('name =~ /^d.*b$/', { name: 'doowb' }));
console.log(e.sync('name =~ /^d.*b$/', { name: 'jonschlinkert' }));
console.log(e.sync('name =~ regex', { name: 'doowb', regex: /^d.*b$/ }));
console.log(e.sync('name =~ regex', { name: 'jonschlinkert', regex: /^d.*b$/ }));
