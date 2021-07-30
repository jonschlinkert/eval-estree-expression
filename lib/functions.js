/* eslint-disable no-new-func */
'use strict';

const FAIL = Symbol('fail');
const generate = require('./generate');

module.exports = (visit, handlers, state = {}) => {
  const functionHandlers = {
    ArrowFunctionExpression(node, ...args) {
      return Function(node.params.map(p => visit(p, ...args)), visit(node.body, ...args));
    },

    AwaitExpression(node, ...args) {
      return visit(node.argument, ...args);
    },

    CallExpression(node, context, ...rest) {
      const callee = visit(node.callee, context, ...rest);
      if (callee === FAIL || typeof callee !== 'function') return FAIL;

      let scope = node.callee.object ? visit(node.callee.object, context, ...rest) : FAIL;
      if (scope === FAIL) scope = null;

      const args = node.arguments.length ? [] : Object.values(context);

      for (const arg of node.arguments) {
        const value = visit(arg, context, ...rest);
        if (value === FAIL) return FAIL;
        args.push(value);
      }

      return callee.apply(scope, args);
    },

    FunctionExpression(node, context, ...rest) {
      const bodies = node.body.body;
      const scope = { ...context };

      for (const param of node.params) {
        if (param.type === 'Identifier') {
          scope[param.name] = null;
        } else {
          return FAIL;
        }
      }

      if (bodies.some(n => visit(n, scope, ...rest) === FAIL)) {
        return FAIL;
      }

      return Function(Object.keys(context).join(', '), generate(node.body));
    },

    ReturnStatement(node) {
      return ' '.repeat(state.indent) + `return ${node.argument.name};`;
    },

    TaggedTemplateExpression(node, ...args) {
      const tag = visit(node.tag, ...args);
      const quasi = node.quasi;
      const strings = quasi.quasis.map(visit);
      const values = quasi.expressions.map(visit);
      return tag.apply(null, [strings].concat(values));
    }
  };

  Object.assign(handlers, functionHandlers);
  return handlers;
};
