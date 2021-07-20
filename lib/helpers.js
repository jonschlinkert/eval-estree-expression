'use strict';

const { isObject } = require('./utils');

exports.unset = async (visit, context, argument) => {
  const object = await visit(argument.object, context);

  if (isObject(object)) {
    delete object[argument.property.name];
    return true;
  }
};

exports.unsetSync = (visit, context, argument) => {
  const object = visit(argument.object, context);

  if (isObject(object)) {
    delete object[argument.property.name];
    return true;
  }
};

exports.unary = async (visit, node, context) => {
  const value = await visit(node.argument, context);

  switch (node.operator) {
    case 'delete': return exports.unset(visit, context, node.argument);
    case 'typeof': return typeof value;
    case 'void': return void value;
    case '~': return ~value;
    case '!': return !value;
    case '+': return Number(value);
    case '-': return -Number(value);
  }
};

exports.unarySync = (visit, node, context) => {
  const value = visit(node.argument, context);

  switch (node.operator) {
    case 'delete': return exports.unsetSync(visit, context, node.argument);
    case 'typeof': return typeof value;
    case 'void': return void value;
    case '~': return ~value;
    case '!': return !value;
    case '+': return Number(value);
    case '-': return -Number(value);
  }
};

exports.comparison = (left, operator, right) => {
  /* eslint-disable eqeqeq, no-new-func */

  switch (operator) {
    // Arithmetic operators
    case '+': return left + right;
    case '-': return left - right;
    case '/': return left / right;
    case '*': return left * right;
    case '%': return left % right;
    case '**': return left ** right;

    // Relational operators
    case 'in': return left in right;
    case 'instanceof': return left instanceof right;
    case '<': return left < right;
    case '>': return left > right;
    case '<=': return left <= right;
    case '>=': return left >= right;

    // Equality operators
    case '!==': return left !== right;
    case '===': return left === right;
    case '!=': return left != right;
    case '==': return left == right;

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

exports.assignment = (left, operator, right) => {
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

exports.postfix = (operator, value) => {
  switch (operator) {
    case '++': return value + 1;
    case '--': return value - 1;
  }
};

exports.prefix = (operator, value) => {
  switch (operator) {
    case '++': return ++value;
    case '--': return --value;
  }
};
