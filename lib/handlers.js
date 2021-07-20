'use strict';

const { comparison, assignment, prefix, postfix, unarySync } = require('./helpers');
const { isSafeKey } = require('./utils');

const createHandlers = (visit, state = {}) => {
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
      return unarySync(visit, node, context);
    },
    UpdateExpression(node, context) {
      const value = visit(node.argument, context);
      const updated = node.prefix ? prefix(node.operator, value) : postfix(node.operator, value);
      context[node.argument.name] = updated;
      return updated;
    }
  };

  return handlers;
};

module.exports = createHandlers;
