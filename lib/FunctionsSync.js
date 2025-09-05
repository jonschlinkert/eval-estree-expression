'use strict';

const transform = require('./transform');
const utils = require('./utils');

module.exports = Base => {
  class Expression extends Base {
    constructor(...args) {
      super(...args);
      this.state = {};
      this.generate = this.options.generate;
    }

    ArrowFunctionExpression(node, context) {
      return this.FunctionExpression(node, context);
    }

    CallExpression(node, context, parent) {
      const callee = this.visit(node.callee, context, node);
      const args = [];

      if (callee === Expression.FAIL || typeof callee !== 'function') {
        this.state.fail = true;
        return Expression.FAIL;
      }

      let scope = node.callee.object ? this.visit(node.callee.object, context, node.callee) : null;
      if (scope === Expression.FAIL) scope = null;

      for (const child of node.arguments) {
        const value = this.visit(child, context, node);

        if (value === Expression.FAIL || this.state.fail) {
          this.state.fail = true;
          return Expression.FAIL;
        }

        if (child.type === 'SpreadElement') {
          args.push(...value);
        } else {
          args.push(value);
        }
      }

      if (this.state.noExecute) {
        return;
      }

      return callee.apply(scope, args);
    }

    ExpressionStatement(node, context, parent) {
      return this.visit(node.expression, context, parent);
    }

    FunctionExpression(node, context) {
      const params = typeof context === 'function' ? context : { ...context };

      for (let i = 0; i < node.params.length; i++) {
        const key = node.params[i];
        if (key.type === 'Identifier') {
          // Use a safe placeholder object to allow member lookups during static checks
          // without causing a hard failure (actual values are bound at runtime).
          params[key.name] = {};
        } else {
          this.state.fail = true;
          return Expression.FAIL;
        }
      }

      const visit = child => {
        // temporarily override "noExecute"
        const noExecute = this.state.noExecute;
        this.state.noExecute = true;

        const v = this.visit(child, params, node);
        if (v === Expression.FAIL || this.state.fail === true) {
          this.state.fail = true;
          return Expression.FAIL;
        }

        // restore "noExecute"
        this.state.noExecute = noExecute;
      };

      if (node.body.body) {
        for (const child of node.body.body) {
          visit(child);

          if (this.state.noExecute) {
            return;
          }
        }
      }

      if (this.generate) {
        node = transform.forEscodegen(node);
      }

      const keys = Object.keys(context);
      const args = Object.values(context);

      if (typeof this.generate !== 'function') {
        throw new TypeError('Expected options.generate to be the "generate" function from "escodegen"');
      }

      /* eslint-disable-next-line no-new-func */
      return Function(keys.join(', '), 'return ' + this.generate(node))(...args);
    }

    MemberExpression(node, context) {
      const data = this.visit(node.object, context, node);
      if (!data || this.state.fail) return Expression.FAIL;

      if (node.property.type === 'Identifier' && !node.computed) {
        if (utils.isSafeKey(node.property.name)) return data[node.property.name];
        this.state.fail = true;
        return Expression.FAIL;
      }

      const prop = this.visit(node.property, context, node);
      if (prop === null || !utils.isSafeKey(prop)) return;

      const value = data[prop];
      if (typeof value === 'function') {
        return value.bind(data);
      }

      return value;
    }

    NewExpression(node, context) {
      const Ctor = this.visit(node.callee, context, node);
      const args = [];

      if (Ctor === Expression.FAIL || this.state.fail || typeof Ctor !== 'function') {
        this.state.fail = true;
        return Expression.FAIL;
      }

      for (const child of node.arguments) {
        const value = this.visit(child, context, node);

        if (value === Expression.FAIL || this.state.fail) {
          this.state.fail = true;
          return Expression.FAIL;
        }

        if (child.type === 'SpreadElement') {
          args.push(...value);
        } else {
          args.push(value);
        }
      }

      return new Ctor(...args);
    }

    OptionalCallExpression(node, context) {
      return this.CallExpression(node, context);
    }

    ReturnStatement(node, context) {
      return this.visit(node.argument, context, node);
    }

    TaggedTemplateExpression(node, context) {
      const tag = this.visit(node.tag, context, node);
      const strings = node.quasi.quasis.map(n => this.visit(n, context, node));
      const values = node.quasi.expressions.map(n => this.visit(n, context, node));
      return tag(...[strings].concat(values));
    }
  }

  return Expression;
};
