'use strict';

const babel = require('@babel/parser');
const { isObject, isSafeKey } = require('./utils');
const { comparison, assignment, prefix, postfix } = require('./helpers');

exports.parse = (input, options) => {
  return babel.parseExpression(input, options);
};

exports.visit = (node, context) => {
  const handler = exports.handlers[node.type];
  if (typeof handler !== 'function') {
    throw new TypeError(`Handler "${node.type}" is not implemented`);
  }
  return handler(node, context);
};

exports.evaluate = (input, context = {}, options = {}) => {
  const parse = options.parse || exports.parse;
  return exports.visit(parse(input, options), context);
};

exports.unset = (context, argument) => {
  const object = exports.visit(argument.object, context);
  if (isObject(object)) {
    delete object[argument.property.name];
    return true;
  }
};

exports.unary = (node, context) => {
  const value = exports.visit(node.argument, context);
  switch (node.operator) {
    case 'delete': return exports.unset(context, node.argument);
    case 'typeof': return typeof value;
    case 'void': return void value;
    case '~': return ~value;
    case '!': return !value;
    case '+': return Number(value);
    case '-': return -Number(value);
  }
};

exports.handlers = {
  AssignmentExpression(node, context) {
    try {
      return assignment(node.left, node.operator, node.right, context);
    } catch (err) {
      throw new SyntaxError(`Assignment expression "${node.operator}" is not supported`);
    }
  },

  ArrayExpression(node, context) {
    const array = [];

    for (const ele of node.elements) {
      if (ele.type === 'SpreadElement') {
        array.push(...exports.visit(ele, context));
      } else {
        array.push(exports.visit(ele, context));
      }
    }

    return array;
  },

  BinaryExpression(node, context) {
    return comparison(exports.visit(node.left, context), node.operator, exports.visit(node.right, context));
  },

  BooleanLiteral(node) {
    return node.value;
  },

  ConditionalExpression({ test, consequent, alternate }, context) {
    return exports.visit(test, context) ? exports.visit(consequent, context) : exports.visit(alternate, context);
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

  Literal(node) {
    return node.value;
  },

  LogicalExpression(node, context) {
    return exports.handlers.BinaryExpression(node, context);
  },

  MemberExpression(node, context) {
    let { computed, object, property, unset } = node;
    if (property.type === 'StringLiteral') {
      property.type = 'Identifier';
      property.name = property.value;
      computed = false;
    }

    const value = exports.visit(object, context);
    const prop = unset ? value : exports.visit(property, computed ? context : value);

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
        Object.assign(object, exports.visit(property, context));
      } else {
        object[property.key.value || property.key.name] = exports.visit(property.value, context);
      }
    }

    return object;
  },

  OptionalMemberExpression(node, context) {
    return exports.visit(node.property, exports.visit(node.object, context) || {});
  },

  RegExpLiteral(node, context) {
    return new RegExp(node.pattern, node.flags);
  },

  SequenceExpression(node, context) {
    const length = node.expressions.length;

    for (let i = 0; i < length - 1; i++) {
      exports.visit(node.expressions[i], context);
    }

    return exports.visit(node.expressions[length - 1], context);
  },

  SpreadElement(node, context) {
    return exports.visit(node.argument, context);
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
      output += exports.visit(node.quasis[i], context);
      output += exports.visit(node.expressions[i], context);
    }

    output += exports.visit(node.quasis[length], context);
    return output;
  },

  ThisExpression(node, context) {
    if (hasOwnProperty.call(context, node.name)) {
      return context['this'];
    }
  },

  UnaryExpression(node, context) {
    return exports.unary(node, context);
  },

  UpdateExpression(node, context) {
    const value = exports.visit(node.argument, context);
    const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
    context[node.argument.name] = updated;
    return updated;
  }
};
