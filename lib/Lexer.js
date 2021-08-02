'use strict';

const { defineProperty } = Reflect;

const REGEX_BOM = /^\ufeff/;
const REGEX_IDENT = /^([a-zA-Z_][-a-zA-Z0-9_]*|\.(?=[a-zA-Z_]))+/;
const REGEX_NUMBER_LITERAL = /^([0-9]+(?:\.[0-9]+)?)/;
const REGEX_MATH_OPERATOR = /^[-+/*]+/;
const REGEX_COMPARISON_OPERATOR = /^(={2,3}|!={1,2}|>={0,2}|<={0,2}|\?\?|&&|\|\||(?:(?:and|or|is not|not|isnt|is)(?!\w)))/;
const REGEX_QUOTED_STRING = /^(['"`])((?:\\.|(?!\1)[\s\S])*?)(\1)/;
const REGEX_SPACE = /^\s+/;
const REGEX_NOT = /^!+/;

const special = {
  '(': 'left_paren',
  ')': 'right_paren',
  '[': 'left_bracket',
  ']': 'right_bracket',
  '{': 'left_brace',
  '}': 'right_brace',
  '<': 'left_angle',
  '>': 'right_angle'
};

class Token {
  constructor(token) {
    this.type = token.type;
    this.value = token.value;
    defineProperty(this, 'loc', { value: token.loc, writable: true });
    defineProperty(this, 'match', { value: token.match });
  }
}

const assert = (truthy, error) => {
  if (!truthy) {
    throw error();
  }
};

class Lexer {
  constructor(input, options) {
    this.options = { ...options };
    this.input = Buffer.from(input);
    this.remaining = String(input);
    this.consumed = '';
    this.tokens = [];
    this.queue = [];
    this.index = 0;
  }

  eos() {
    return this.remaining === '' && this.queue.length === 0;
  }

  enqueue(token) {
    if (token) this.queue.push(token);
    return token;
  }

  dequeue() {
    return this.queue.shift();
  }

  lookbehind(n = 1) {
    assert(Number.isInteger(n), () => new Error('Expected a positive integer'));
    return this.tokens[this.tokens.length - n];
  }

  lookahead(n = 1) {
    assert(Number.isInteger(n), () => new Error('Expected a positive integer'));
    let fetch = n - this.queue.length;
    while (fetch-- > 0 && this.enqueue(this.advance()));
    return this.queue[--n];
  }

  peek(key) {
    return this.lookahead(1);
  }

  consume(value = '') {
    const length = value.length;
    this.remaining = this.remaining.slice(length);
    this.consumed += value;
    return value;
  }

  scan(regex, type = 'text') {
    const match = regex.exec(this.remaining);
    if (match) {
      return new Token({ type, value: match[0], match });
    }
  }

  capture(regex, type) {
    const token = this.scan(regex, type);
    if (token) {
      this.consume(token.match[0]);
      return token;
    }
  }

  captureBom() {
    if (this.index > 0 || this.bom) return;
    const token = this.capture(REGEX_BOM, 'bom');
    if (token) {
      this.bom = true;
      this.index = 0;
      token.value = '';
      return token;
    }
  }

  captureComparisonOperator() {
    const token = this.capture(REGEX_COMPARISON_OPERATOR, 'ComparisonOperator');
    if (token) {
      if (token.value === 'is' && !this.eos()) {
        token.output = '===';
        return token;
      }

      if ((token.value === 'isnt' || token.value === 'is not') && !this.eos()) {
        token.output = '!==';
        return token;
      }

      if (token.value === 'not' && !this.eos()) {
        this.accept('space');
        token.output = '!';
        return token;
      }

      const prev = this.prev();
      if (token.value === 'and' && !this.eos()) token.output = '&&';
      if (token.value === 'or' && !this.eos()) token.output = '||';

      if (prev?.type === 'ComparisonOperator' && prev?.prev?.type !== 'Identifier' && !prev?.prev?.type.startsWith('right_')) {
        prev.output = prev.value;
        prev.type = 'Identifier';
      }

      if (prev?.type !== 'space') {
        Reflect.defineProperty(token, 'prev', { value: prev });
      }
      return token;
    }
  }

  captureMathOperator() {
    return this.capture(REGEX_MATH_OPERATOR, 'MathOperator');
  }

  captureSpace() {
    const token = this.capture(REGEX_SPACE, 'space');
    if (token) {
      token.value = token.value.replace(/\t/g, '  ');
      return token;
    }
  }

  captureIdent() {
    const token = this.capture(REGEX_IDENT, 'Identifier');
    if (token) {
      if (token.value === 'defined') {
        const prev = this.prev();
        if (prev?.type === 'ComparisonOperator') {
          const key = prev.output ? 'output' : 'value';
          prev[key] = (prev[key][0] === '!' ? '=' : '!') + prev[key].slice(1);
          token.value = 'undefined';
        }
      }
      return token;
    }
  }

  captureLiteral() {
    return this.capture(REGEX_QUOTED_STRING, 'StringLiteral');
  }

  captureNot() {
    const token = this.capture(REGEX_NOT, 'not');
    if (token) {
      return token;
    }
  }

  captureNumericLiteral() {
    return this.capture(REGEX_NUMBER_LITERAL, 'NumericLiteral');
  }

  captureText() {
    const value = this.consume(this.remaining[0]);
    if (value) {
      const type = special[value] || 'text';
      const token = new Token({ type, value, match: [value] });
      return token;
    }
  }

  advance() {
    if (this.eos()) return;
    return this.captureBom()
      || this.captureLiteral()
      || this.captureNumericLiteral()
      || this.captureComparisonOperator()
      || this.captureMathOperator()
      || this.captureSpace()
      || this.captureIdent()
      || this.captureNot()
      || this.captureText()
      || this.fail();
  }

  accept(type) {
    const next = this.peek();

    if (next?.type === type) {
      return this.next();
    }
  }

  next() {
    return this.dequeue() || this.advance();
  }

  prev() {
    let prev = this.tokens[this.tokens.length - 1];
    if (prev?.type === 'space') {
      prev = this.tokens[this.tokens.length - 2];
    }
    return prev;
  }

  push(token) {
    if (!token) return;
    const prev = this.tokens[this.tokens.length - 1];
    if (token.type === 'text' && prev?.type === 'text') {
      prev.value += token.value;
      return token;
    }

    this.tokens.push(token);
    this.token = token;
    return token;
  }

  lex() {
    while (!this.eos()) this.push(this.next());
    return this.tokens;
  }

  tokenize() {
    return this.lex();
  }

  fail() {
    throw new SyntaxError(`Unrecognized character: ${this.remaining[0]}`);
  }

  static tokenize = (input, options) => {
    const lexer = new this(input, options);
    return lexer.tokenize();
  }

  static toString = (tokens, options) => {
    if (typeof tokens === 'string') tokens = this.tokenize(tokens, options);
    return tokens.map(t => t.output || t.value).join('');
  }
}

module.exports = Lexer;
