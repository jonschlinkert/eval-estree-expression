'use strict';

const { evaluate } = require('..');

const babel = require('@babel/parser');
const parse = input => babel.parseExpression(input);

/**
 * Readme examples
 */

(async () => {
  console.log('--- and');
  console.log(await evaluate(parse('1 + 2'))); //=> 3
  console.log(await evaluate(parse('5 * 2'))); //=> 10
  console.log(await evaluate(parse('1 > 2'))); //=> false
  console.log(await evaluate(parse('1 < 2'))); //=> true


  console.log(await evaluate(parse('page.title === "home"'), { page: { title: 'home' } })); //=> true

  const options = { booleanLogicalOperators: true };

  console.log('--- and');
  console.log(await evaluate(parse('a && b'), { a: undefined, b: true })); //=> undefined
  console.log(await evaluate(parse('a && b'), { a: undefined, b: false })); //=> undefined
  console.log(await evaluate(parse('a && b'), { a: undefined, b: true }, options)); //=> false
  console.log(await evaluate(parse('a && b'), { a: undefined, b: false }, options)); //=> false
  console.log('--- or');
  console.log(await evaluate(parse('a || b'), { a: false, b: null })); //=> null
  console.log(await evaluate(parse('a || b'), { a: false, b: undefined })); //=> undefined
  console.log(await evaluate(parse('a || b'), { a: false, b: null }, options)); //=> false
  console.log(await evaluate(parse('a || b'), { a: false, b: undefined }, options)); //=> false
})();
