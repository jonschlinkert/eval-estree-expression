'use strict';

exports.comparison = (left, operator, right, ...args) => {
  const options = args.pop();

  if (operator === 'in' && typeof right === 'string' && options.allow_in_operator_in_strings) {
    return right.includes(left);
  }

  switch (operator) {
    // Arithmetic operators
    case '+': return left + right;
    case '-': return left - right;
    case '/': return left / right;
    case '*': return left * right;
    case '%': return left % right;
    case '**': return left ** right;

    // Relational operators
    case 'instanceof': return left instanceof right;
    case 'in': return left in right;
    case '<': return left < right;
    case '>': return left > right;
    case '<=': return left <= right;
    case '>=': return left >= right;

    // Equality operators
    case '!==': return left !== right;
    case '===': return left === right;
    case '!=': return left != right;  /* eslint-disable-line eqeqeq */
    case '==': return left == right; /* eslint-disable-line eqeqeq */

    // Bitwise shift operators
    case '<<': return left << right;
    case '>>': return left >> right;
    case '>>>': return left >>> right;

    // Binary bitwise operators
    case '&': return left & right;
    case '|': return left | right;
    case '^': return left ^ right;

    // Binary logical operators
    case '&&': return left && right; // Logical AND.
    case '||': return left || right; // Logical OR.
    case '??': return left ?? right; // Nullish Coalescing Operator.
  }
};

exports.postfix = (operator, value) => {
  switch (operator) {
    case '++': return value + 1;
    case '--': return value - 1;
  }
};

exports.prefix = (operator, value) => {
  switch (operator) {
    case '++': return value + 1;
    case '--': return value - 1;
  }
};

exports.assignment = (visit, { scope }, left, operator, right, ...args) => {
  switch (operator) {
    case '=':    // Assignment operator.
    case '*=':   // Multiplication assignment.
    case '**=':  // Exponentiation assignment.
    case '/=':   // Division assignment.
    case '%=':   // Remainder assignment.
    case '+=':   // Addition assignment.
    case '-=':   // Subtraction assignment
    case '<<=':  // Left shift assignment.
    case '>>=':  // Right shift assignment.
    case '>>>=': // Unsigned right shift assignment.
    case '&=':   // Bitwise AND assignment.
    case '^=':   // Bitwise XOR assignment.
    case '|=':   // Bitwise OR assignment.
    case '&&=':  // Logical AND assignment.
    case '||=':  // Logical OR assignment.
    case '??=':  // Logical nullish assignment.
    default: {
      throw new SyntaxError(`Assignment expression "${operator}" is not supported`);
    }
  }
};
