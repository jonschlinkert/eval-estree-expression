'use strict';

const utils = require('./utils');
const visitor = require('./visitor');
const { handlers } = require('./expression-sync');
const { comparison, prefix, postfix } = require('./helpers');

exports.unset = async (node, ...args) => {
  const object = await visit(node.object, ...args);

  if (utils.isObject(object)) {
    Reflect.deleteProperty(object, node.property.name);
    return true;
  }
};

exports.unary = async (node, ...args) => {
  const value = node.operation !== 'delete' && await visit(node.argument, ...args);

  switch (node.operator) {
    case 'delete': return exports.unset(node.argument, ...args);
    case 'typeof': return typeof value;
    case 'void': return void value;
    case '~': return ~value;
    case '!': return !value;
    case '+': return Number(value);
    case '-': return -Number(value);
  }
};

/**
 * Override sync handlers with async
 */

exports.handlers = {
  ...handlers,

  async ArrayExpression(node, ...args) {
    const array = [];

    for (const ele of node.elements) {
      if (ele.type === 'SpreadElement') {
        array.push(...(await visit(ele, ...args)));
      } else {
        array.push(visit(ele, ...args));
      }
    }

    return Promise.all(array);
  },

  async BinaryExpression(node, ...args) {
    const left = await visit(node.left, ...args);
    const right = await visit(node.right, ...args);
    return comparison(left, node.operator, right, ...args);
  },

  async ConditionalExpression({ test, consequent, alternate }, ...args) {
    return await visit(test, ...args)
      ? await visit(consequent, ...args)
      : await visit(alternate, ...args);
  },

  async MemberExpression(node, context, options) {
    let { computed, object, property, unset } = node;

    if (property.type === 'StringLiteral') {
      property.type = 'Identifier';
      property.name = property.value;
      computed = false;
    }

    const value = await visit(object, context, options);
    if (object.type === 'Identifier') context[object.name] = value;

    const prop = unset ? value : await visit(property, computed ? context : value, options);
    return computed ? value[prop] : prop;
  },

  async ObjectExpression(node, ...args) {
    const object = {};

    for (const prop of node.properties) {
      if (prop.type === 'SpreadElement') {
        Object.assign(object, await visit(prop, ...args));
      } else {
        object[prop.key.value || prop.key.name] = await visit(prop.value, ...args);
      }
    }

    return object;
  },

  async OptionalMemberExpression(node, ...args) {
    return visit(node.property, await visit(node.object, ...args) || {});
  },

  async SequenceExpression(node, ...args) {
    const length = node.expressions.length;

    for (let i = 0; i < length - 1; i++) {
      await visit(node.expressions[i], ...args);
    }

    return visit(node.expressions[length - 1], ...args);
  },

  async TemplateLiteral(node, ...args) {
    const length = node.expressions.length;
    let output = '';

    for (let i = 0; i < length; i++) {
      output += await visit(node.quasis[i], ...args);
      output += await visit(node.expressions[i], ...args);
    }

    output += await visit(node.quasis[length], ...args);
    return output;
  },

  async UnaryExpression(node, ...args) {
    return exports.unary(node, ...args);
  },

  async UpdateExpression(node, context, options) {
    const value = await visit(node.argument, context, options);
    const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
    context[node.argument.name] = updated;
    return updated;
  }
};

const visit = exports.visit = visitor(exports.handlers);

exports.evaluate = async (ast, context = {}, options = {}) => {
  return visit(ast, context, options);
};
