'use strict';

const start = Date.now();
process.on('exit', () => console.log(`Time: ${Date.now() - start}ms`));

// const esprima = require('esprima');
const babel = require('@babel/parser');
const { evaluate } = require('..');

// const parse = (input, options) => esprima.parse(input).body[0].expression;
const parse = (input, options) => babel.parseExpression(input, options);

const context = {
  n: 6,
  foo: async function(x) { return await x * 100; },
  bar: async (x, y) => await x * 100 * y,
  obj: { x: { y: 555 } },
  z: 3
};

const input = '[1,2,3+4*10+n,foo(3+5),bar(10-4, z),obj[""+"x"].y]';
const tree = parse(input);

evaluate(tree, context, { functions: true })
  .then(console.log)
  .catch(console.error);
