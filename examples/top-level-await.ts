const { evaluate } = require('..');
const { parseExpression } = require('@babel/parser');

const opts = { functions: true, allowAwaitOutsideFunction: true };

const e = (input, ctx, options) => {
  return evaluate(parseExpression(input, options), ctx, options);
};

const run = async () => {
  console.log(await e('await 1', {}, opts));
  console.log(await e('Promise.resolve(1)', { Promise }, opts));
  console.log(await e('await Promise.resolve(1)', { Promise }, opts));
};

run();
