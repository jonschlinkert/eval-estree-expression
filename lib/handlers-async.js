'use strict';

const syncHandlers = require('./handlers');
const { comparison, prefix, postfix, unary } = require('./helpers');

const createHandlers = (visit, state = {}) => {
  const handlers = {
    ...syncHandlers(visit, state),

    async ArrayExpression(node, context) {
      const array = [];

      for (const ele of node.elements) {
        if (ele.type === 'SpreadElement') {
          array.push(...(await visit(ele, context)));
        } else {
          array.push(visit(ele, context));
        }
      }

      return Promise.all(array);
    },
    async BinaryExpression(node, context) {
      return comparison(await visit(node.left, context), node.operator, await visit(node.right, context));
    },
    async ConditionalExpression({ test, consequent, alternate }, context) {
      return await visit(test, context) ? await visit(consequent, context) : await visit(alternate, context);
    },
    async MemberExpression(node, context) {
      let { computed, object, property, unset } = node;

      if (property.type === 'StringLiteral') {
        property.type = 'Identifier';
        property.name = property.value;
        computed = false;
      }

      const value = await visit(object, context);
      const prop = unset ? value : await visit(property, computed ? context : value);
      return computed ? value[prop] : prop;
    },
    async ObjectExpression(node, context) {
      const object = {};

      for (const property of node.properties) {
        if (property.type === 'SpreadElement') {
          Object.assign(object, await visit(property, context));
        } else {
          object[property.key.value || property.key.name] = await visit(property.value, context);
        }
      }

      return object;
    },
    async OptionalMemberExpression(node, context) {
      return visit(node.property, await visit(node.object, context) || {});
    },
    async SequenceExpression(node, context) {
      const length = node.expressions.length;

      for (let i = 0; i < length - 1; i++) {
        await visit(node.expressions[i], context);
      }

      return visit(node.expressions[length - 1], context);
    },
    async TemplateLiteral(node, context) {
      const length = node.expressions.length;
      let output = '';

      for (let i = 0; i < length; i++) {
        output += await visit(node.quasis[i], context);
        output += await visit(node.expressions[i], context);
      }

      output += await visit(node.quasis[length], context);
      return output;
    },
    async UnaryExpression(node, context) {
      return unary(visit, node, context);
    },
    async UpdateExpression(node, context) {
      const value = await visit(node.argument, context);
      const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
      context[node.argument.name] = updated;
      return updated;
    }
  };

  return handlers;
};

module.exports = createHandlers;
