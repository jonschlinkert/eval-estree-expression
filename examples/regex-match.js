'use strict';

const start = Date.now();
process.on('exit', () => console.log(`Time: ${Date.now() - start}ms`));

const { evaluate: e } = require('../test/support');

// console.log(e.sync(parse('/^d.*b$/.test(name)'), { name: 'doowb' }, { functions: false }));
// console.log(e.sync(parse('/^d.*b$/.test(name)'), { name: 'jonschlinkert' }, { functions: false }));
console.log(e.sync('name =~ /^d.*b$/', { name: 'doowb' }));
console.log(e.sync('name =~ /^d.*b$/', { name: 'jonschlinkert' }));
