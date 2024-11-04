// eslint-disable-next-line strict
const babel = require('@babel/parser');
const { evaluate } = require('..');

// const parse = (input, options) => esprima.parse(input).body[0].expression;
const parse = (input, options) => babel.parseExpression(input, options);

// Optional call expression
const tree = parse('a?.()');
console.log(evaluate.sync(tree, { a: () => 2 }, { functions: true }));

evaluate(tree, { a: () => 2 }, { functions: true })
  .then(console.log);
