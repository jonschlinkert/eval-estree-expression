'use strict';

const start = Date.now();
process.on('exit', () => console.log(`Time: ${Date.now() - start}ms`));

const babel = require('@babel/parser');
const lexer = require('../lib/Lexer');
const { evaluate: e } = require('../test/support');

const parse = (input, options) => babel.parseExpression(lexer.toString(input), options);

const visitors = {
  BinaryExpression(node, context) {
    if (this.options?.keywords?.includes('defined') && node.right?.name === 'defined') {
      node.operator = node.operator.startsWith('!') ? '==' : '!=';
      node.right.name = 'undefined';
    }

    const left = this.visit(node.left, context, node);
    const right = this.visit(node.right, context, node);
    return this.comparison(left, node.operator, right, context, node);
  }
};

const assert = require('assert/strict');

// assert(!e.sync(parse('"jonschlinkert" == name'), { name: 'doowb' }));
// assert(e.sync(parse('"jonschlinkert" == name'), { name: 'jonschlinkert' }));
// assert(e.sync(parse('name is "jon"', { operators: ['is'] }), { name: 'jon' }));
// assert(!e.sync(parse('name is not "jon"', { operators: ['is not', 'isnt', 'not'] }), { name: 'jon' }));
// assert(!e.sync(parse('name is not defined', { operators: ['is', 'not'] }), { name: 'doowb' }, { keywords: ['defined'] }));
// assert(e.sync(parse('name is "doowb"', { operators: ['is', 'not'] }), { name: 'doowb' }));
// assert(e.sync(parse('name is not "jon"', { operators: ['is', 'not'] }), { name: 'doowb' }));
// assert(!e.sync(parse('name is not "jon"', { operators: ['is', 'not'] }), { name: 'jon' }));
// assert(e.sync(parse('"jon" in name'), { name: 'jonschlinkert' }, { allow_in_operator_in_strings: true, visitors: syncVisitors }));
// assert(!e.sync(parse('"jon" in name'), { name: 'doowb' }, { allow_in_operator_in_strings: true, visitors: syncVisitors }));

(async () => {
  // assert(!await e(parse('"jonschlinkert" == name'), { name: 'doowb' }));
  // assert(await e(parse('"jonschlinkert" == name'), { name: 'jonschlinkert' }));
  // assert(await e(parse('name is "jon"', { operators: ['is'] }), { name: 'jon' }));
  // assert(!await e(parse('name is not "jon"', { operators: ['is not', 'isnt', 'not'] }), { name: 'jon' }));
  assert(await e(parse('name is defined'), { name: 'doowb' }, { keywords: ['defined'], visitors, functions: true }));
  // assert(!await e(parse('name is not defined', { operators: ['is', 'not'] }), { name: 'doowb' }, { keywords: ['defined'] }));
  // assert(await e(parse('name is "doowb"', { operators: ['is', 'not'] }), { name: 'doowb' }));
  // assert(await e(parse('name is not "jon"', { operators: ['is', 'not'] }), { name: 'doowb' }));
  // assert(!await e(parse('name is not "jon"', { operators: ['is', 'not'] }), { name: 'jon' }));
  // assert(await e(parse('"jon" in name'), { name: 'jonschlinkert' }, { allow_in_operator_in_strings: true, visitors }));
  // assert(!await e(parse('"jon" in name'), { name: 'doowb' }, { allow_in_operator_in_strings: true, visitors }));
})();
