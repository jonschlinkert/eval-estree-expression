'use strict';

const FunctionsSync = require('./FunctionsSync');
const transform = require('./transform');
const utils = require('./utils');

module.exports = Base => {
  class Expression extends FunctionsSync(Base) {
    AwaitExpression(node, context, parent) {
      return this.visit(node.argument, context, parent);
    }

    async CallExpression(node, context) {
      const callee = await this.visit(node.callee, context, node);
      const args = [];

      if (callee === Expression.FAIL || typeof callee !== 'function') {
        this.state.fail = true;
        return Expression.FAIL;
      }

      let scope = node.callee.object ? await this.visit(node.callee.object, context, node.callee) : null;
      if (scope === Expression.FAIL) scope = null;

      for (const child of node.arguments) {
        const value = await this.visit(child, context, node);

        if (value === Expression.FAIL) {
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

    async FunctionExpression(node, context) {
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

      const visit = async child => {
        // temporarily override "noExecute"
        const noExecute = this.state.noExecute;
        this.state.noExecute = true;

        const v = await this.visit(child, params, node);
        if (v === Expression.FAIL || this.state.fail === true) {
          this.state.fail = true;
          return Expression.FAIL;
        }

        // restore "noExecute"
        this.state.noExecute = noExecute;
      };

      if (node.body.body) {
        for (const child of node.body.body) {
          await visit(child);

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

    async MemberExpression(node, context, parent) {
      const data = await this.visit(node.object, context, node);

      if (!data || this.state.fail) {
        return Expression.FAIL;
      }

      if (node.property.type === 'Identifier' && node.computed === false) {
        if (utils.isSafeKey(node.property.name)) {
          const value = data?.[node.property.name];

          // bind methods to their objects
          if (data != null && typeof value === 'function') {
            return value.bind(data);
          }

          return value;
        }

        this.state.fail = true;
        return Expression.FAIL;
      }

      // Handle computed property access (e.g., obj[prop])
      const prop = await this.visit(node.property, context, node);
      if (prop === null || !utils.isSafeKey(prop)) {
        return;
      }

      const value = data?.[prop];
      if (data != null && typeof value === 'function') {
        return value.bind(data);
      }

      return value;
    }

    async NewExpression(node, context) {
      const Ctor = await this.visit(node.callee, context, node);
      const args = [];

      if (Ctor === Expression.FAIL || this.state.fail || typeof Ctor !== 'function') {
        this.state.fail = true;
        return Expression.FAIL;
      }

      for (const child of node.arguments) {
        const value = await this.visit(child, context, node);

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

    async TaggedTemplateExpression(node, context) {
      const tag = await this.visit(node.tag, context, node);
      const strings = await Promise.all(node.quasi.quasis.map(n => this.visit(n, context, node)));
      const values = await Promise.all(node.quasi.expressions.map(n => this.visit(n, context, node)));
      return tag(...[strings].concat(values));
    }
  }

  return Expression;
};
