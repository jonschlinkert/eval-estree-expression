'use strict';

const { generate } = require('escodegen');
const { FAIL } = require('./constants');
const codegen = require('./codegen');
const utils = require('./utils');

module.exports = Base => {
  class Expression extends Base {
    constructor(...args) {
      super(...args);
      this.codegen = codegen(this);
      this.state = {};
    }

    ArrowFunctionExpression(node, context) {
      /* eslint-disable-next-line no-new-func */
      return Function(node.params.map(p => this.visit(p, context, node)), this.visit(node.body, context, node));
    }

    CallExpression(node, context) {
      if (this.state.fail) return FAIL;

      const callee = this.visit(node.callee, context, node);
      if (callee === FAIL || typeof callee !== 'function') {
        this.state.fail = true;
        return FAIL;
      }

      let scope = node.callee.object ? this.visit(node.callee.object, context, node.callee) : null;
      if (scope === FAIL) scope = null;

      const args = node.arguments.length ? [] : Object.values(context);
      for (const child of node.arguments) {
        const value = this.visit(child, context, node);

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

      if (this.state.noExecute) {
        return;
      }

      return callee.apply(scope, args);
    }

    ExpressionStatement(node, context, parent) {
      return this.visit(node.expression, context, parent);
    }

    FunctionExpression(node, context) {
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

        if (this.visit(child, temp, node) === FAIL) {
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

    Identifier(node, context, parent) {
      const value = super.Identifier(node, context, parent);
      const name = node.name;

      if (value === undefined && global[name]) {
        const allowed = this.options.allow_builtin_objects;

        if (allowed === true || allowed === name || (Array.isArray(allowed) && allowed.includes(name))) {
          return global[name];
        }

        if (this.options.strict) {
          throw new TypeError(`Cannot read property '${name}' of undefined`);
        }
      }

      if (value === undefined) {
        this.state.fail = true;
        return FAIL;
      }

      return value;
    }

    // Identifier(node, context, parent) {
    //   const value = super.Identifier(node, context, parent);
    //   const name = node.name;

    //   if (value === undefined) {
    //     switch (name) {
    //       case 'Array': return Array;
    //       case 'Boolean': return Boolean;
    //       case 'BigInt': return BigInt;
    //       case 'Date': return Date;
    //       case 'Math': return Math;
    //       case 'Number': return Number;
    //       case 'RegExp': return RegExp;
    //       case 'String': return String;
    //       case 'Symbol': return Symbol;
    //       default: {
    //         if (this.options.strict === true) {
    //           throw new TypeError(`Cannot read property '${name}' of undefined`);
    //         }

    //         this.state.fail = true;
    //         return FAIL;
    //       }
    //     }
    //   }

    //   return value;
    // }

    MemberExpression(node, context) {
      const obj = this.visit(node.object, context, node);
      if (!obj || this.state.fail) return FAIL;

      if (node.property.type === 'Identifier' && !node.computed) {
        if (utils.isSafeKey(node.property.name)) return obj[node.property.name];
        this.state.fail = true;
        return FAIL;
      }

      const prop = this.visit(node.property, context, node);
      if (prop === null || !utils.isSafeKey(prop)) return;
      return obj[prop];
    }

    NewExpression(node, context) {
      const Ctor = this.visit(node.callee, context, node);
      const args = [];

      if (Ctor === FAIL || this.state.fail || typeof Ctor !== 'function') {
        this.state.fail = true;
        return FAIL;
      }

      for (const child of node.arguments) {
        const value = this.visit(child, context, node);

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
