'use strict';

const FunctionsSync = require('./FunctionsSync');
const Functions = require('./Functions');
const variables = require('./variables');
const utils = require('./utils');

class ExpressionSync {
  static FAIL = Symbol('fail');
  static ExpressionSync = ExpressionSync;

  static variables = (tree, options) => variables(tree, options);
  static evaluate = (tree, context, options) => {
    return new ExpressionSync(tree, options).evaluate(context);
  };

  constructor(tree, options = {}, { created = false } = {}) {
    this.options = { ...options };
    this.visitors = { ...this.options.visitors };
    this.tree = tree;
    this.state = {};
    this.stack = [];
    this.seen = new Set();

    if (options.functions && !created) {
      const create = this.constructor.isAsync ? Functions : FunctionsSync;
      const Expr = create(this.constructor);
      return new Expr(tree, options, { created: true });
    }
  }

  visit(node, context, parent) {
    Reflect.defineProperty(node, 'parent', { value: node.parent || parent });
    const visitor = this.visitors[node.type] || this[node.type];

    if (typeof visitor !== 'function') {
      const prefix = node.type === 'CallExpression' ? 'Functions are' : `visitor "${node.type}" is`;
      const message = `${prefix} not supported`;
      throw new TypeError(message);
    }

    const block = node.type === 'ArrayExpression' || node.type === 'ObjectExpression';
    if (block) this.stack.push(node);

    const value = visitor.call(this, node, context, parent);
    const resolve = v => {
      if (v instanceof Promise) return v.then(v => resolve(v));
      if (block) this.stack.pop();
      if (this.state.fail) return;
      return v;
    };

    return resolve(value);
  }

  evaluate(context) {
    return this.visit(this.tree, context || {});
  }

  isRegExpOperator(node, context)  {
    return node.operator === '=' && node.right?.operator === '~' && this.options.regexOperator !== false;
  }

  assignment(node)  {
    switch (node.operator) {
      case '=':    // Assignment operator.
      case '*=':   // Multiplication assignment.
      case '**=':  // Exponentiation assignment.
      case '/=':   // Division assignment.
      case '%=':   // Remainder assignment.
      case '+=':   // Addition assignment.
      case '-=':   // Subtraction assignment
      case '<<=':  // Left shift assignment.
      case '>>=':  // Right shift assignment.
      case '>>>=': // Unsigned right shift assignment.
      case '&=':   // Bitwise AND assignment.
      case '^=':   // Bitwise XOR assignment.
      case '|=':   // Bitwise OR assignment.
      case '&&=':  // Logical AND assignment.
      case '||=':  // Logical OR assignment.
      case '??=':  // Logical nullish assignment.
      default: {
        throw new SyntaxError(`Assignment expression "${node.operator}" is not supported`);
      }
    }
  }

  postfix(node, value)  {
    switch (node.operator) {
      case '++': return value + 1;
      case '--': return value - 1;
    }
  }

  prefix(node, value)  {
    switch (node.operator) {
      case '++': return value + 1;
      case '--': return value - 1;
    }
  }

  unset(node, context) {
    const object = this.visit(node.object, context, node);

    const unset = obj => {
      if (utils.isObject(obj)) {
        Reflect.deleteProperty(obj, node.property.name);
        context[node.object.name] = obj;
        return true;
      }
    };

    return object instanceof Promise ? object.then(obj => unset(obj)) : unset(object);
  }

  comparison(left, operator, right, context, node) {
    const bool = this.options.booleanLogicalOperators === true;

    if (typeof left === 'symbol' || typeof right === 'symbol') {
      this.state.fail = true;
      return ExpressionSync.FAIL;
    }

    const s = v => {
      if (typeof v === 'symbol') {
        this.state.fail = true;
        return;
      }

      return v;
    };

    // only lazily evaluate "right" when necessary
    const val = () => s(typeof right === 'function' ? right() : right);

    if (operator === 'in') {
      const value = val();

      if (!this.options.strict && (typeof value === 'string' || Array.isArray(value))) {
        return value.includes(left);
      }

      return left in value;
    }

    switch (node.operator) {
      // Arithmetic operators
      case '+': return left + val();
      case '-': return left - val();
      case '/': return left / val();
      case '*': return left * val();
      case '%': return left % val();
      case '**': return left ** val();

      // Relational operators
      case 'instanceof': return left instanceof val();
      case '<': return left < val();
      case '>': return left > val();
      case '<=': return left <= val();
      case '>=': return left >= val();

      // Equality operators
      case '!==': return left !== val();
      case '===': return left === val();
      case '!=': return left != val();  /* eslint-disable-line eqeqeq */
      case '==': return left == val(); /* eslint-disable-line eqeqeq */

      // Bitwise shift operators
      case '<<': return left << val();
      case '>>': return left >> val();
      case '>>>': return left >>> val();

      // Binary bitwise operators
      case '&': return left & val();
      case '|': return left | val();
      case '^': return left ^ val();

      // Binary logical operators
      case '&&': return bool ? Boolean(left && val()) : left && val(); // Logical AND.
      case '||': return bool ? Boolean(left || val()) : left || val(); // Logical OR.
      case '??': return bool ? Boolean(left ?? val()) : left ?? val(); // Nullish Coalescing Operator.
    }
  }

  /**
   * Begin visitors
   */

  AssignmentExpression(node, context, parent) {
    if (this.isRegExpOperator(node, context)) {
      const value = this.visit(node.left, context, node);
      const regex = this.visit(node.right.argument, context, node.right);

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

  ArrayExpression(node, context, parent) {
    const array = [];

    for (const child of node.elements) {
      const value = this.visit(child, context, node);

      if (this.state.fail || value === ExpressionSync.FAIL) {
        this.state.fail = true;
        return ExpressionSync.FAIL;
      }

      if (child.type === 'SpreadElement') {
        array.push(...value);
      } else {
        array.push(value);
      }
    }

    return array;
  }

  BigIntLiteral(node) {
    return BigInt(node.value);
  }

  BinaryExpression(node, context) {
    const left = this.visit(node.left, context, node);
    const right = () => this.visit(node.right, context, node);

    if (left instanceof Promise) {
      return left.then(v => this.comparison(v, node.operator, right, context, node));
    }

    return this.comparison(left, node.operator, right, context, node);
  }

  BlockStatement(node, context, parent) {
    const output = [];

    for (const child of node.body) {
      output.push(this.visit(child, context, node));
    }

    return output;
  }

  BooleanLiteral(node) {
    return node.value;
  }

  ConditionalExpression(node, context) {
    const { test, consequent, alternate } = node;
    const truthy = this.visit(test, context, node);
    return truthy ? this.visit(consequent, context, node) : this.visit(alternate, context, node);
  }

  Identifier(node, context, parent) {
    if (!utils.isSafeKey(node.name)) return;

    if (context == null && this.options.strict !== false) {
      throw new TypeError(`Cannot read property '${node.name}' of undefined`);
    }

    if (node.name === 'undefined' && this.stack.length === 0) {
      return;
    }

    if (context != null) {
      if (context[node.name] !== undefined) return context[node.name];
      if (hasOwnProperty.call(context, node.name)) {
        return;
      }
    }

    const error = () => {
      if (this.options.strict !== false) {
        throw new ReferenceError(`${node.name} is undefined`);
      }
      this.state.fail = true;
      return ExpressionSync.FAIL;
    };

    if (parent?.type === 'ObjectProperty' && parent.shorthand === true) {
      return error();
    }

    if (this.stack.some(n => n.type === 'ArrayExpression' || n.type === 'ObjectExpression')) {
      return error();
    }

    if (this.options.strict === true && this.options.functions !== true) {
      throw new TypeError(`Cannot read property '${node.name}' of undefined`);
    }
  }

  Literal(node) {
    return node.value;
  }

  LogicalExpression(node, context, parent) {
    return this.BinaryExpression(node, context, parent);
  }

  MemberExpression(node, context, parent) {
    const { computed, object, property, unset } = node;
    const value = this.visit(object, context, node) ?? context[object.name];
    const data = computed ? context : value;

    if (!utils.isSafeKey(property.name)) {
      this.state.fail = true;
      return ExpressionSync.FAIL;
    }

    let prop;
    if (unset) {
      prop = value;
    } else if (node.optional) {
      const optional = v => this.visit(property, data || {}, node);
      prop = property instanceof Promise ? property.then(v => optional(v)) : optional(property);
    } else {
      prop = this.visit(property, data, node);
    }

    if (prop == null && property.name && data) {
      prop = data[property.name];
    }

    if (!utils.isSafeKey(prop)) return;
    return computed && value && prop != null ? value[prop] : prop;
  }

  NullLiteral(node) {
    return null;
  }

  NumericLiteral(node) {
    return node.value;
  }

  ObjectExpression(node, context) {
    const object = {};

    for (const property of node.properties) {
      const { key, type, value } = property;

      if (type === 'SpreadElement') {
        Object.assign(object, this.visit(property, context, node));
      } else {
        const name = property.computed ? this.visit(key, context, property) : (key.value || key.name);
        object[name] = this.visit(value, context, property);
      }
    }

    return object;
  }

  OptionalMemberExpression(node, context) {
    const obj = this.visit(node.object, context, node);
    const optional = v => this.visit(node.property, v || {}, node);
    return obj instanceof Promise ? obj.then(v => optional(v)) : optional(obj);
  }

  RegExpLiteral(node) {
    return new RegExp(node.pattern, node.flags);
  }

  SequenceExpression(node, context, parent) {
    const length = node.expressions.length;

    for (let i = 0; i < length - 1; i++) {
      this.visit(node.expressions[i], context, node);
    }

    return this.visit(node.expressions[length - 1], context, node);
  }

  SpreadElement(node, context) {
    return this.visit(node.argument, context, node);
  }

  StringLiteral(node) {
    return node.value;
  }

  TemplateElement(node) {
    return node.value.cooked;
  }

  TemplateLiteral(node, context) {
    const length = node.expressions.length;
    let output = '';

    for (let i = 0; i < length; i++) {
      output += this.visit(node.quasis[i], context, node);
      output += this.visit(node.expressions[i], context, node);
    }

    output += this.visit(node.quasis[length], context, node);
    return output;
  }

  ThisExpression(node, context) {
    if (!context) throw new TypeError('Cannot read property "this" of undefined');
    if (Reflect.has(context, 'this')) {
      return context['this'];
    }
  }

  UnaryExpression(node, context) {
    const value = node.operator !== 'delete' && this.visit(node.argument, context, node);

    const unary = v => {
      switch (node.operator) {
        case 'delete': return this.unset(node.argument, context, node);
        case 'typeof': return typeof v;
        case 'void': return void v;
        case '~': return ~v;
        case '!': return !v;
        case '+': return +v; // eslint-disable-line no-implicit-coercion
        case '-': return -v;
      }
    };

    return value instanceof Promise ? value.then(obj => unary(obj)) : unary(value);
  }

  UpdateExpression(node, context, parent) {
    const value = this.visit(node.argument, context, node);

    const update = v => {
      const updated = node.prefix ? this.prefix(node, v) : this.postfix(node, v);
      context[node.argument.name] = updated;
      return updated;
    };

    return value instanceof Promise ? value.then(obj => update(obj)) : update(value);
  }
}

module.exports = ExpressionSync;
