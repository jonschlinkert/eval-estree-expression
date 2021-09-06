'use strict';

const start = Date.now();
process.on('exit', () => console.log(`Time: ${Date.now() - start}ms`));

const { parseExpression } = require('@babel/parser');
const { variables } = require('..');

console.log(variables(parseExpression('x * (y * 3) + z.y.x'))); //=> ['x', 'y', 'z']
console.log(variables(parseExpression('(a || b) ? c + d : e * f'))); //=> ['a', 'b', 'c', 'd', 'e', 'f']
