'use strict';

const { default: getValue } = require('get-value');
const FunctionsSync = require('./FunctionsSync');
const Functions = require('./Functions');
const variables = require('./variables');
const utils = require('./utils');

const MAX_ARRAY_LENGTH = 10000;
const MAX_EXPRESSION_DEPTH = 50;
// const MAX_OBJECT_PROPERTIES = 1000;
// const MAX_STACK_DEPTH = 100;

class ExpressionSync {
  static FAIL = Symbol('fail');
  static ExpressionSync = ExpressionSync;

  static variables = (tree, options) => variables(tree, options);
  static evaluate = (tree, context, options) => {
    return new ExpressionSync(tree, options).evaluate(context);
  };

  constructor(tree, options = {}, { created = false } = {}) {
    this.options = {
      maxExpressionDepth: MAX_EXPRESSION_DEPTH,
      maxArrayLength: MAX_ARRAY_LENGTH,
      ...options
    };

    this.visitors = { ...this.options.visitors };
    this.tree = tree;
    this.state = {
      stackDepth: 0,
      expressionDepth: 0,
      seenObjects: new WeakSet(),
      templateLiterals: new Set()
    };

    this.stack = [];
    this.seen = new Set();

    if (options.functions && !created) {
      const create = this.constructor.isAsync ? Functions : FunctionsSync;
      const Expr = create(this.constructor);
      return new Expr(tree, options, { created: true });
    }
  }

  incrementDepth() {
    this.state.expressionDepth++;

    if (this.state.expressionDepth > MAX_EXPRESSION_DEPTH) {
      throw new RangeError('Maximum expression depth exceeded');
    }
  }

  decrementDepth() {
    this.state.expressionDepth--;
  }

  createContext(context) {
    if (typeof context === 'function') {
      return context;
    }

    if (utils.isPlainObject(context)) {
      return { ...context };
    }

    return context;
  }

  visit(node, context, parent) {
    this.incrementDepth();

    try {
      Reflect.defineProperty(node, 'parent', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: node.parent || parent
      });

      const visitor = this.visitors[node.type] || this[node.type];

      if (typeof visitor !== 'function') {
        const prefix = node.type === 'CallExpression' ? 'Functions are' : `visitor "${node.type}" is`;
        const message = `${prefix} not supported`;
        throw new TypeError(message);
      }

      // const block = node.type === 'ArrayExpression' || node.type === 'ObjectExpression';
      const ignore = ['Identifier', 'BinaryExpression'];

      if (!ignore.includes(node.type)) {
        this.stack.push(node);
      } else {
        //
      }

      const value = visitor.call(this, node, context, parent);
      const resolve = v => {
        if (v instanceof Promise) return v.then(v => resolve(v));
        if (!ignore.includes(node.type)) this.stack.pop();
        if (this.state.fail) return;
        return v;
      };

      return resolve(value);
    } finally {
      this.decrementDepth();
    }
  }

  evaluate(context) {
    return this.visit(this.tree, context || {});
  }

  isRegExpOperator(node, context)  {
    return node.operator === '=' && node.right?.operator === '~' && this.options.regexOperator !== false;
  }

  assignment(node) {
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

  assignOperation(operator, left, right) {
    switch (operator) {
      case '=': return right;
      case '+=': return left + right;
      case '-=': return left - right;
      case '*=': return left * right;
      case '/=': return left / right;
      case '%=': return left % right;
      case '**=': return left ** right;
      case '<<=': return left << right;
      case '>>=': return left >> right;
      case '>>>=': return left >>> right;
      case '&=': return left & right;
      case '^=': return left ^ right;
      case '|=': return left | right;
      case '&&=': return left && right;
      case '||=': return left || right;
      case '??=': return left ?? right;
      default: {
        throw new SyntaxError(`Assignment operator "${operator}" is not supported`);
      }
    }
  }

  postfix(node, value) {
    switch (node.operator) {
      case '++': return value + 1;
      case '--': return value - 1;
    }
  }

  prefix(node, value) {
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

        const name = node.object.name;
        if (name && this.options.prefix && !name.startsWith(this.options.prefix)) {
          node.object.name = `${this.options.prefix}.${node.object.name}`;
        }

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
      case '!=': return left != val(); /* eslint-disable-line eqeqeq */
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
      if (array.length >= this.options.maxArrayLength) {
        throw new RangeError('Maximum array length exceeded');
      }

      const value = this.visit(child, context, node);

      if (this.state.fail || value === ExpressionSync.FAIL) {
        this.state.fail = true;
        return ExpressionSync.FAIL;
      }

      if (child.type === 'SpreadElement') {
        const spreadValues = value;
        if (Array.isArray(spreadValues)) {
          if (array.length + spreadValues.length > this.options.maxArrayLength) {
            throw new RangeError('Maximum array length exceeded');
          }
          array.push(...spreadValues);
        }
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
    return this.visit(truthy ? consequent : alternate, context, node);
  }

  Identifier(node, context, parent) {
    if (!utils.isSafeKey(node.name)) return;

    if (context == null && this.options.strict !== false) {
      throw new TypeError(`Cannot read property '${node.name}' of undefined`);
    }

    if (node.name === 'undefined' && this.stack.length === 0) {
      return;
    }

    if (this.options.prefix && !node.name.startsWith(this.options.prefix)) {
      if (!this.insideFunction || !this.functionParams?.some(p => p.name === node.name)) {
        node.name = `${this.options.prefix}.${node.name}`;
      }
    }

    if (context != null) {
      if (typeof context?.lookup === 'function') {
        const value = context.lookup(node.name);
        if (value !== undefined) {
          return value;
        }
      }

      const value = context[node.name] ?? getValue(context, node.name);
      if (value !== undefined) {
        return value;
      }

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

    if (object.name && this.options.prefix && !object.name.startsWith(this.options.prefix)) {
      object.name = `${this.options.prefix}.${object.name}`;
    }

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

    if (prop === undefined && property.name && data) {
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
        const name = property.computed ? this.visit(key, context, property) : key.value || key.name;
        const result = this.visit(value, context, property);

        if (property.shorthand && this.options.prefix) {
          property.shorthand = false;
        }

        object[name] = result;
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

  StringLiteral(node, context) {
    if (this.options.allowContextStringLiterals === true) {
      return context[node.value] ?? node.value;
    }

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

    const thisKey = this.options.prefix ? `${this.options.prefix}.this` : 'this';
    return getValue(context, thisKey) ?? getValue(context, 'this');
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
        default: break;
      }
    };

    return value instanceof Promise ? value.then(obj => unary(obj)) : unary(value);
  }

  UpdateExpression(node, context, parent) {
    const value = this.visit(node.argument, context, node);

    const update = v => {
      const updated = node.prefix ? this.prefix(node, v) : this.postfix(node, v);

      const name = node.argument.name;
      if (name && this.options.prefix && !name.startsWith(this.options.prefix)) {
        node.argument.name = `${this.options.prefix}.${node.argument.name}`;
      }

      context[node.argument.name] = updated;
      return updated;
    };

    return value instanceof Promise ? value.then(obj => update(obj)) : update(value);
  }

  ExpressionStatement(node, context) {
    return this.visit(node.expression, context, node);
  }
}

module.exports = ExpressionSync;
