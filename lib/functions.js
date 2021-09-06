'use strict';

const FunctionsSync = require('./FunctionsSync');
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
      const noExecute = this.state.noExecute;
      const params = { ...context };

      for (let i = 0; i < node.params.length; i++) {
        const key = node.params[i];
        if (key.type === 'Identifier') {
          params[key.name] = null;
        } else {
          this.state.fail = true;
          return Expression.FAIL;
        }
      }

      const visit = async child => {
        // temporarily override "noExecute"
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
        for (const child of node.body.body) await visit(child);
      } else {
        await visit(node.body);
      }

      if (this.state.noExecute) return;

      const keys = Object.keys(context);
      const args = Object.values(context);

      if (typeof this.generate !== 'function') {
        throw new TypeError('Expected options.generate to be the "generate" function from "escodegen"');
      }

      /* eslint-disable-next-line no-new-func */
      return Function(keys.join(', '), 'return ' + this.generate(node))(...args);
    }

    async MemberExpression(node, context) {
      const data = await this.visit(node.object, context, node);
      if (!data || this.state.fail) return Expression.FAIL;

      if (node.property.type === 'Identifier' && !node.computed) {
        if (utils.isSafeKey(node.property.name)) return data[node.property.name];
        this.state.fail = true;
        return Expression.FAIL;
      }

      const prop = await this.visit(node.property, context, node);
      if (prop === null || !utils.isSafeKey(prop)) return;
      return data[prop];
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

