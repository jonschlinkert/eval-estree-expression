'use strict';

const babel = require('@babel/parser');
const sync = require('./expression-sync');
const { isObject } = require('./utils');
const { comparison, prefix, postfix } = require('./helpers');
const { handlers } = sync;

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

exports.evaluate = (input, context = {}, options) => {
  return exports.visit(exports.parse(input, options), context);
};

exports.unset = async (context, argument) => {
  const object = await exports.visit(argument.object, context);
  if (isObject(object)) {
    delete object[argument.property.name];
    return true;
  }
};

exports.unary = async (node, context) => {
  const value = await exports.visit(node.argument, context);
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

/**
 * Override sync handlers with async
 */

exports.handlers = {
  ...handlers,

  async ArrayExpression(node, context) {
    const array = [];
    for (const ele of node.elements) {
      if (ele.type === 'SpreadElement') {
        array.push(...(await exports.visit(ele, context)));
      } else {
        array.push(exports.visit(ele, context));
      }
    }
    return Promise.all(array);
  },

  async BinaryExpression(node, context) {
    const left = await exports.visit(node.left, context);
    const right = await exports.visit(node.right, context);
    return comparison(left, node.operator, right);
  },

  async ConditionalExpression({ test, consequent, alternate }, context) {
    return await exports.visit(test, context)
      ? await exports.visit(consequent, context)
      : await exports.visit(alternate, context);
  },

  async MemberExpression(node, context) {
    let { computed, object, property, unset } = node;
    if (property.type === 'StringLiteral') {
      property.type = 'Identifier';
      property.name = property.value;
      computed = false;
    }
    const value = await exports.visit(object, context);
    const prop = unset ? value : await exports.visit(property, computed ? context : value);
    return computed ? value[prop] : prop;
  },

  async ObjectExpression(node, context) {
    const object = {};
    for (const property of node.properties) {
      if (property.type === 'SpreadElement') {
        Object.assign(object, await exports.visit(property, context));
      } else {
        object[property.key.value || property.key.name] = await exports.visit(property.value, context);
      }
    }
    return object;
  },

  async OptionalMemberExpression(node, context) {
    return exports.visit(node.property, await exports.visit(node.object, context) || {});
  },

  async SequenceExpression(node, context) {
    const length = node.expressions.length;
    for (let i = 0; i < length - 1; i++) {
      await exports.visit(node.expressions[i], context);
    }
    return exports.visit(node.expressions[length - 1], context);
  },

  async TemplateLiteral(node, context) {
    const length = node.expressions.length;
    let output = '';
    for (let i = 0; i < length; i++) {
      output += await exports.visit(node.quasis[i], context);
      output += await exports.visit(node.expressions[i], context);
    }
    output += await exports.visit(node.quasis[length], context);
    return output;
  },

  async UnaryExpression(node, context) {
    return exports.unary(node, context);
  },

  async UpdateExpression(node, context) {
    const value = await exports.visit(node.argument, context);
    const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
    context[node.argument.name] = updated;
    return updated;
  }
};

/**
 * Expose `sync` properties for convenience
 */

exports.sync = sync;
exports.parse.sync = sync.parse;
exports.visit.sync = sync.visit;
exports.evaluate.sync = sync.evaluate;
exports.handlers.sync = sync.handlers;
