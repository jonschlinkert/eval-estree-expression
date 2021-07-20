'use strict';

const babel = require('@babel/parser');
const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

const UNSAFE_KEYS = new Set(['constructor', 'prototype', '__proto__']);
const isSafeKey = k => UNSAFE_KEYS.has(k) === false;

const comparison = (left, operator, right) => {
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

const assignment = (left, operator, right) => {
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

const postfix = (operator, value) => {
  switch (operator) {
    case '++': return value + 1;
    case '--': return value - 1;
  }
};

const prefix = (operator, value) => {
  switch (operator) {
    case '++': return ++value;
    case '--': return --value;
  }
};

const create = (state = {}) => {
  const unary = (node, context) => {
    const value = visit(node.argument, context);

    switch (node.operator) {
      case 'delete': return unset(context, node.argument);
      case 'typeof': return typeof value;
      case 'void': return void value;
      case '~': return ~value;
      case '!': return !value;
      case '+': return Number(value);
      case '-': return -Number(value);
    }
  };

  const unset = (context, argument) => {
    const object = visit(argument.object, context);

    if (isObject(object)) {
      delete object[argument.property.name];
      return true;
    }
  };

  const handlers = {
    AssignmentExpression(node, context) {
      return assignment(node.left, node.operator, node.right, context);
    },
    ArrayExpression(node, context) {
      const array = [];

      for (const ele of node.elements) {
        if (ele.type === 'SpreadElement') {
          array.push(...visit(ele, context));
        } else {
          array.push(visit(ele, context));
        }
      }

      return array;
    },
    BinaryExpression(node, context) {
      return comparison(visit(node.left, context), node.operator, visit(node.right, context));
    },
    BooleanLiteral(node) {
      return node.value;
    },
    ConditionalExpression({ test, consequent, alternate }, context) {
      return visit(test, context) ? visit(consequent, context) : visit(alternate, context);
    },
    Identifier(node, context) {
      if (!context) throw new TypeError(`Cannot read property '${node.name}' of undefined`);

      if (!isSafeKey(node.name)) {
        return;
      }

      if (node.name !== 'undefined' && hasOwnProperty.call(context, node.name)) {
        return context[node.name];
      }
    },
    LogicalExpression(node, context) {
      return handlers.BinaryExpression(node, context);
    },
    MemberExpression(node, context) {
      let { computed, object, property, unset } = node;

      if (property.type === 'StringLiteral') {
        property.type = 'Identifier';
        property.name = property.value;
        computed = false;
      }

      const value = visit(object, context);
      const prop = unset ? value : visit(property, computed ? context : value);
      return computed ? value[prop] : prop;
    },
    NullLiteral(node, context) {
      return null;
    },
    NumericLiteral(node) {
      return node.value;
    },
    ObjectExpression(node, context) {
      const object = {};

      for (const property of node.properties) {
        if (property.type === 'SpreadElement') {
          Object.assign(object, visit(property, context));
        } else {
          object[property.key.value || property.key.name] = visit(property.value, context);
        }
      }

      return object;
    },
    OptionalMemberExpression(node, context) {
      return visit(node.property, visit(node.object, context) || {});
    },
    RegExpLiteral(node, context) {
      return new RegExp(node.pattern, node.flags);
    },
    SequenceExpression(node, context) {
      const length = node.expressions.length;

      for (let i = 0; i < length - 1; i++) {
        visit(node.expressions[i], context);
      }

      return visit(node.expressions[length - 1], context);
    },
    SpreadElement(node, context) {
      return visit(node.argument, context);
    },
    StringLiteral(node) {
      return node.value;
    },
    TemplateElement(node) {
      return node.value.cooked;
    },
    TemplateLiteral(node, context) {
      const length = node.expressions.length;
      let output = '';

      for (let i = 0; i < length; i++) {
        output += visit(node.quasis[i], context);
        output += visit(node.expressions[i], context);
      }

      output += visit(node.quasis[length], context);
      return output;
    },
    ThisExpression(node, context) {
      if (hasOwnProperty.call(context, node.name)) {
        return context['this'];
      }
    },
    UnaryExpression(node, context) {
      return unary(node, context);
    },
    UpdateExpression(node, context) {
      const value = visit(node.argument, context);
      const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
      context[node.argument.name] = updated;
      return updated;
    }
  };

  const parse = (input, options) => {
    return babel.parseExpression(input, options);
  };

  const visit = (node, context) => {
    const handler = handlers[node.type];

    if (typeof handler !== 'function') {
      throw new TypeError(`Handler "${node.type}" is not implemented`);
    }

    return handler(node, context);
  };

  const evaluate = (input, context = {}, options) => {
    return visit(parse(input, options), context);
  };

  return {
    handlers,
    parse,
    visit,
    evaluate
  };
};

module.exports = create();
