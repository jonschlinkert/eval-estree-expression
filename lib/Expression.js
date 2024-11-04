'use strict';

const ExpressionSync = require('./ExpressionSync');
const variables = require('./variables');
const utils = require('./utils');

class Expression extends ExpressionSync {
  static isAsync = true;
  static Expression = Expression;
  static ExpressionSync = ExpressionSync;

  static variables = (tree, options) => variables(tree, options);
  static evaluate = (tree, context, options) => {
    return new Expression(tree, options).evaluate(context);
  };

  async evaluate(context) {
    return this.visit(this.tree, context || {});
  }

  async comparison(left, operator, right, context, node) {
    const bool = this.options.booleanLogicalOperators === true;

    if (typeof left === 'symbol' || typeof right === 'symbol') {
      this.state.fail = true;
      return Expression.FAIL;
    }

    const s = v => {
      if (typeof v === 'symbol') {
        this.state.fail = true;
        return;
      }

      return v;
    };

    const val = () => s(typeof right === 'function' ? right() : right);

    switch (operator) {
      case 'in': {
        const value = await val();

        if (!this.options.strict && (typeof value === 'string' || Array.isArray(value))) {
          return value.includes(left);
        }

        return left in value;
      }

      // Arithmetic operators
      case '+': return left + await val();
      case '-': return left - await val();
      case '/': return left / await val();
      case '*': return left * await val();
      case '%': return left % await val();
      case '**': return left ** await val();

      // Relational operators
      case 'instanceof': return left instanceof await val();
      case '<': return left < await val();
      case '>': return left > await val();
      case '<=': return left <= await val();
      case '>=': return left >= await val();

      // Equality operators
      case '!==': return left !== await val();
      case '===': return left === await val();
      case '!=': return left != await val();  /* eslint-disable-line eqeqeq */
      case '==': return left == await val(); /* eslint-disable-line eqeqeq */

      // Bitwise shift operators
      case '<<': return left << await val();
      case '>>': return left >> await val();
      case '>>>': return left >>> await val();

      // Binary bitwise operators
      case '&': return left & await val();
      case '|': return left | await val();
      case '^': return left ^ await val();

      // Binary logical operators
      case '&&': return bool ? Boolean(left && await val()) : left && await val(); // Logical AND.
      case '||': return bool ? Boolean(left || await val()) : left || await val(); // Logical OR.
      case '??': return bool ? Boolean(left ?? await val()) : left ?? await val(); // Nullish Coalescing Operator.
    }
  }

  /**
   * Begin visitors
   */

  async ArrayExpression(node, context, parent) {
    const array = [];

    for (const child of node.elements) {
      const value = await this.visit(child, context, node);

      if (value === Expression.FAIL) {
        this.state.fail = true;
        return Expression.FAIL;
      }

      if (child.type === 'SpreadElement') {
        array.push(...value);
      } else {
        array.push(value);
      }
    }

    return array;
  }

  async AssignmentExpression(node, context, parent) {
    if (this.isRegExpOperator(node, context)) {
      const value = await this.visit(node.left, context, node);
      const regex = await this.visit(node.right.argument, context, node.right);

      if (regex instanceof RegExp) {
        return regex.test(value);
      }
    }

    try {
      return this.assignment(node, context, parent);
    } catch (err) {
      throw new SyntaxError(`Assignment expression "${node.operator}" is not supported`);
    }
  }

  async BlockStatement(node, context, parent) {
    const output = [];

    for (const child of node.body) {
      output.push(await this.visit(child, context, node));
    }

    return output;
  }

  async ConditionalExpression(node, context) {
    const { test, consequent, alternate } = node;
    const truthy = await this.visit(test, context, node);
    return truthy ? await this.visit(consequent, context, node) : await this.visit(alternate, context, node);
  }

  async MemberExpression(node, context, parent) {
    const { computed, object, property, unset } = node;
    const value = (await this.visit(object, context, node)) ?? context[object.name];
    const data = computed ? context : value;

    if (!utils.isSafeKey(property.name)) {
      this.state.fail = true;
      return Expression.FAIL;
    }

    let prop = unset ? value : await this.visit(property, node.optional ? data || {} : data, node);
    if (prop === undefined && property.name && data) {
      prop = data[property.name];
    }

    if (!utils.isSafeKey(prop)) return;
    return computed && value && prop != null ? value[prop] : prop;
  }

  async ObjectExpression(node, context) {
    const object = {};

    for (const property of node.properties) {
      const { key, type, value } = property;

      if (type === 'SpreadElement') {
        Object.assign(object, await this.visit(property, context, node));
      } else {
        const name = property.computed ? await this.visit(key, context, property) : (key.value || key.name);
        object[name] = await this.visit(value, context, property);
      }
    }

    return object;
  }

  async SequenceExpression(node, context, parent) {
    const length = node.expressions.length;

    for (let i = 0; i < length - 1; i++) {
      await this.visit(node.expressions[i], context, node);
    }

    return this.visit(node.expressions[length - 1], context, node);
  }

  async TemplateLiteral(node, context) {
    const length = node.expressions.length;
    let output = '';

    for (let i = 0; i < length; i++) {
      output += await this.visit(node.quasis[i], context, node);
      output += await this.visit(node.expressions[i], context, node);
    }

    output += await this.visit(node.quasis[length], context, node);
    return output;
  }
}

Expression.evaluate.sync = (...args) => ExpressionSync.evaluate(...args);
module.exports = Expression;
