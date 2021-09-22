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
  foo: function(x) { return x * 100; },
  bar: (x, y) => x * 100 * y,
  obj: { x: { y: 555 } },
  z: 3
};

const input = '[1,2,3+4*10+n,foo(3+5),bar(10-4, z),obj[""+"x"].y]';
const tree = parse(input);
const result = evaluate.sync(tree, context, { functions: true });

console.log(result);

const options = {
  functions: true
};

console.log(evaluate.sync(parse('/([a-z]+)/.exec(" foo ")'), { x: 2 }, options));
//=> [ 'foo', 'foo', index: 1, input: ' foo ', groups: undefined ]

console.log(evaluate.sync(parse('[1, 2, 3].map(e => e + e)'), { x: 2 }, options));
//=> throws an error
