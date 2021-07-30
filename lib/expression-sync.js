'use strict';

const visitor = require('./visitor');
const { isObject, isSafeKey } = require('./utils');
const { comparison, assignment, prefix, postfix } = require('./helpers');

const unset = (node, ...args) => {
  const object = visit(node.object, ...args);

  if (isObject(object)) {
    Reflect.deleteProperty(object, node.property.name);
    return true;
  }
};

const unary = (node, ...args) => {
  const value = node.operation !== 'delete' && visit(node.argument, ...args);

  switch (node.operator) {
    case 'delete': return unset(node.argument, ...args);
    case 'typeof': return typeof value;
    case 'void': return void value;
    case '~': return ~value;
    case '!': return !value;
    case '+': return Number(value);
    case '-': return -Number(value);
  }
};

const isCustomRegexMatch = (node, ...args) => {
  const options = args.pop();

  if (node.operator === '=' && node.right?.operator === '~' && options?.custom_regex_match !== false) {
    return node.right?.argument?.type === 'RegExpLiteral';
  }
};

const handlers = {
  AssignmentExpression(node, ...args) {
    if (isCustomRegexMatch(node, ...args)) {
      return handlers.RegExpLiteral(node.right.argument).test(visit(node.left, ...args));
    }

    try {
      const state = { scope: {} };
      return assignment(visit, state, node.left, node.operator, node.right, ...args);
    } catch (err) {
      throw new SyntaxError(`Assignment expression "${node.operator}" is not supported`);
    }
  },

  ArrayExpression(node, ...args) {
    const array = [];

    for (const ele of node.elements) {
      if (ele.type === 'SpreadElement') {
        array.push(...visit(ele, ...args));
      } else {
        array.push(visit(ele, ...args));
      }
    }

    return array;
  },

  BinaryExpression(node, ...args) {
    const left = visit(node.left, ...args);
    const right = visit(node.right, ...args);
    return comparison(left, node.operator, right, ...args);
  },

  BooleanLiteral(node) {
    return node.value;
  },

  ConditionalExpression({ test, consequent, alternate }, ...args) {
    return visit(test, ...args) ? visit(consequent, ...args) : visit(alternate, ...args);
  },

  Identifier(node, context, options = {}) {
    if (!context && options.strict !== false) {
      throw new TypeError(`Cannot read property '${node.name}' of undefined`);
    }
    if (!isSafeKey(node.name)) return;
    if (context && node.name !== 'undefined' && node.name in context) {
      return context[node.name];
    }
  },

  LogicalExpression(node, ...args) {
    return handlers.BinaryExpression(node, ...args);
  },

  MemberExpression(node, context, options) {
    let { computed, object, property, unset } = node;
    if (property.type === 'StringLiteral') {
      property.type = 'Identifier';
      property.name = property.value;
      computed = false;
    }

    const value = visit(object, context, options);
    const prop = unset ? value : visit(property, computed ? context : value, options);
    return computed ? value[prop] : prop;
  },

  BigIntLiteral(node) {
    return BigInt(node.value);
  },

  NullLiteral(node) {
    return null;
  },

  NumericLiteral(node) {
    return node.value;
  },

  ObjectExpression(node, ...args) {
    const object = {};

    for (const property of node.properties) {
      if (property.type === 'SpreadElement') {
        Object.assign(object, visit(property, ...args));
      } else {
        object[property.key.value || property.key.name] = visit(property.value, ...args);
      }
    }

    return object;
  },

  OptionalMemberExpression(node, ...args) {
    return visit(node.property, visit(node.object, ...args) || {});
  },

  RegExpLiteral(node) {
    return new RegExp(node.pattern, node.flags);
  },

  SequenceExpression(node, ...args) {
    const length = node.expressions.length;

    for (let i = 0; i < length - 1; i++) {
      visit(node.expressions[i], ...args);
    }

    return visit(node.expressions[length - 1], ...args);
  },

  SpreadElement(node, ...args) {
    return visit(node.argument, ...args);
  },

  StringLiteral(node) {
    return node.value;
  },

  TemplateElement(node) {
    return node.value.cooked;
  },

  TemplateLiteral(node, ...args) {
    const length = node.expressions.length;
    let output = '';

    for (let i = 0; i < length; i++) {
      output += visit(node.quasis[i], ...args);
      output += visit(node.expressions[i], ...args);
    }

    output += visit(node.quasis[length], ...args);
    return output;
  },

  ThisExpression(node, context, options) {
    if (!context) throw new TypeError('Cannot read property "this" of undefined');
    if (hasOwnProperty.call(context, node.name)) {
      return context['this'];
    }
  },

  UnaryExpression(node, ...args) {
    return unary(node, ...args);
  },

  UpdateExpression(node, context, options) {
    const value = visit(node.argument, context, options);
    const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
    context[node.argument.name] = updated;
    return updated;
  }
};

const visit = visitor(handlers);

exports.visit = visit;
exports.handlers = handlers;
exports.unset = unset;
exports.unary = unary;

exports.evaluate = (ast, context = {}, options = {}) => {
  return visit(ast, context, options);
};
