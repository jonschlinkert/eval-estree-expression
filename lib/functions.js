'use strict';

const { generate } = require('escodegen');
const { FAIL } = require('./constants');
const FunctionsSync = require('./FunctionsSync');
const utils = require('./utils');

module.exports = Base => {
  class Expression extends FunctionsSync(Base) {
    AwaitExpression(node, context, parent) {
      return this.visit(node.argument, context, parent);
    }

    async CallExpression(node, context) {
      const callee = await this.visit(node.callee, context, node);
      if (callee === FAIL || typeof callee !== 'function') return FAIL;

      let scope = node.callee.object ? await this.visit(node.callee.object, context, node.callee) : null;
      if (scope === FAIL) {
        this.state.fail = true;
        scope = null;
      }

      const args = node.arguments.length ? [] : Object.values(context);
      for (const child of node.arguments) {
        const value = await this.visit(child, context, node);

        if (value === FAIL) {
          this.state.fail = true;
          return FAIL;
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
      const nodes = node.body.body;
      const noExecute = this.state.noExecute;
      const temp = { ...context };

      for (let i = 0; i < node.params.length; i++) {
        const key = node.params[i];
        if (key.type === 'Identifier') {
          temp[key.name] = null;
        } else {
          this.state.fail = true;
          return FAIL;
        }
      }

      for (const child of nodes) {
        this.state.noExecute = true;
        const v = await this.visit(child, temp, node);

        if (v === FAIL || this.state.fail) {
          this.state.fail = true;
          return FAIL;
        }

        this.state.noExecute = noExecute;
      }

      if (this.state.noExecute) {
        return;
      }

      const keys = Object.keys(context);
      const vals = Object.values(context);
      /* eslint-disable-next-line no-new-func */
      return Function(keys.join(', '), 'return ' + generate(node)).apply(null, vals);
    }

    // async Identifier(node, context, parent) {
    //   const value = await super.Identifier(node, context, parent);
    //   const name = node.name;

    //   if (value === undefined && global[name]) {
    //     const allowed = this.options.allow_builtin_objects;

    //     if (allowed === true || allowed === name || (Array.isArray(allowed) && allowed.includes(name))) {
    //       return global[name];
    //     }

    //     throw new TypeError(`Cannot read property '${name}' of undefined`);
    //   }

    //   if (value === undefined) {
    //     this.state.fail = true;
    //     return FAIL;
    //   }

    //   return value;
    // }

    async Identifier(node, context, parent) {
      const value = await super.Identifier(node, context, parent);

      if (value === undefined) {
        switch (node.name) {
          // case 'Array': return Array;
          // case 'Boolean': return Boolean;
          // case 'BigInt': return BigInt;
          // case 'Math': return Math;
          // case 'Number': return Number;
          // case 'String': return String;
          // case 'Symbol': return Symbol;
          default: {
            if (this.options.strict === true) {
              throw new TypeError(`Cannot read property '${node.name}' of undefined`);
            }
            this.state.fail = true;
            return FAIL;
          }
        }
      }

      return value;
    }

    async MemberExpression(node, context) {
      const obj = await this.visit(node.object, context, node);
      if (!obj || this.state.fail) return FAIL;

      if (node.property.type === 'Identifier' && !node.computed) {
        if (utils.isSafeKey(node.property.name)) return obj[node.property.name];
        this.state.fail = true;
        return FAIL;
      }

      const prop = await this.visit(node.property, context, node);
      if (prop === null || !utils.isSafeKey(prop)) return;
      return obj[prop];
    }

    async NewExpression(node, context) {
      const Ctor = await this.visit(node.callee, context, node);
      const args = [];

      if (Ctor === FAIL || this.state.fail || typeof Ctor !== 'function') {
        this.state.fail = true;
        return FAIL;
      }

      for (const child of node.arguments) {
        const value = await this.visit(child, context, node);

        if (value === FAIL || this.state.fail) {
          this.state.fail = true;
          return FAIL;
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
