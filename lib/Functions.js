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

    async FunctionExpression(node, context, parent) {
      this.insideFunction = true;
      this.functionParams = node.params;

      const params = this.createContext(context);

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
      } else if (this.options.prefix) {
        await visit(node.body);
      }

      this.functionParams = null;
      this.insideFunction = false;

      if (typeof this.generate !== 'function') {
        throw new TypeError('Expected options.generate to be the "generate" function from "escodegen"');
      }

      if (this.generate && this.options.generator === 'escodegen') {
        node = transform.forEscodegen(node);
      }

      const evaluate = (withBody = node.body?.type === 'ObjectExpression') => {
        if (withBody) {
          const body = node.body;
          node.body = {
            type: 'BlockStatement',
            body: [{
              type: 'ReturnStatement',
              argument: body
            }]
          };
        }

        if (this.options.prefix) {
          /* eslint-disable-next-line no-new-func */
          return Function(this.options.prefix, 'return ' + this.generate(node))(context);
        }

        const keys = Object.keys(context);
        const args = Object.values(context);

        /* eslint-disable-next-line no-new-func */
        return Function(keys.join(', '), 'return ' + this.generate(node))(...args);
      };

      try {
        return evaluate();
      } catch (err) {
        if (err.message.includes("Unexpected token ':'")) {
          return evaluate(true);
        }

        throw err;
      }
    }

    async MemberExpression(node, context, parent) {
      const initialName = node.object?.name;

      if (this.options.prefix && initialName && !initialName.startsWith(this.options.prefix)) {
        node.object.name = `${this.options.prefix}.${initialName}`;
      }

      const object = await this.visit(node.object, context, node) ?? context[node.object.name];
      if (!object || this.state.fail) {
        return Expression.FAIL;
      }

      if (node.property.type === 'Identifier' && node.computed === false) {
        if (utils.isSafeKey(node.property.name)) {
          const value = object?.[node.property.name];

          // bind methods to their objects
          if (object != null && typeof value === 'function') {
            return value.bind(object);
          }

          return value;
        }

        if (this.options?.strictUnsafe) {
          throw new TypeError(`Unsafe property name: ${node.property.name}`);
        }

        this.state.fail = true;
        return Expression.FAIL;
      }

      // Handle computed property access (e.g., obj[prop])
      const prop = await this.visit(node.property, context, node);
      if (prop === null || !utils.isSafeKey(prop)) {
        return;
      }

      const value = object?.[prop];
      if (typeof value === 'function') {
        return value.bind(object);
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
