'use strict';

const start = Date.now();
process.on('exit', () => console.log(`Time: ${Date.now() - start}ms`));

const visitor = require('../lib/visitor');
const { handlers } = require('../lib/expression-sync');
const { comparison } = require('../lib/helpers');
const { evaluate: e, parse } = require('../test/support');

const syncHandlers = {
  BinaryExpression(node, ...args) {
    const options = args[args.length - 1];
    let { left, operator, right } = node;

    if (options?.keywords?.includes('defined') && right?.name === 'defined') {
      operator = operator.startsWith('!') ? '==' : '!=';
      right.name = 'undefined';
    }

    return comparison(visit(left, ...args), operator, visit(right, ...args), ...args);
  }
};

const asyncHandlers = {
  async BinaryExpression(node, ...args) {
    const options = args[args.length - 1];
    let operator = node.operator;

    const left = await visit(node.left, ...args);
    const right = await visit(node.right, ...args);

    if (options?.keywords?.includes('defined') && right?.name === 'defined') {
      operator = operator.startsWith('!') ? '==' : '!=';
      right.name = 'undefined';
    }

    return comparison(left, operator, right, ...args);
  }
};

console.log(e.sync(parse('"jonschlinkert" == name'), { name: 'doowb' }));
console.log(e.sync(parse('"jonschlinkert" == name'), { name: 'jonschlinkert' }));
// console.log(e.sync(parse('name is "jon"', { operators: ['is'] }), { name: 'jon' }));
// console.log(e.sync(parse('name not "jon"', { operators: ['is not', 'isnt', 'not'] }), { name: 'jon' }));
// console.log(e.sync(parse('name is not defined', { operators: ['is', 'not'] }), { name: 'doowb' }, { keywords: ['defined'] }));
// console.log(e.sync(parse('name is "doowb"', { operators: ['is', 'not'] }), { name: 'doowb' }));
// console.log(e.sync(parse('name is not "jon"', { operators: ['is', 'not'] }), { name: 'doowb' }));
// console.log(e.sync(parse('name is not "jon"', { operators: ['is', 'not'] }), { name: 'jon' }));
console.log(e.sync(parse('"jon" in name'), { name: 'jonschlinkert' }, { allow_in_operator_in_strings: true }));
