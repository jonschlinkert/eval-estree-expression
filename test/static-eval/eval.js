'use strict';

const assert = require('node:assert/strict');
const escodegen = require('escodegen');
const { evaluate } = require('../..');
const { parse } = require('esprima');

/**
 * Tests from static-eval library
 * Licensed under the MIT License.
 * Copyright (c) 2013 James Halliday
 */

const opts = { functions: true, strict: false, generate: escodegen.generate };

describe('eval', () => {
  describe('sync', () => {
    it('resolved', () => {
      const src = '[1,2,3+4*10+(n||6),foo(3+5),obj[""+"x"].y]';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, {
        n: false,
        foo: function(x) { return x * 100; },
        obj: { x: { y: 555 } }
      }, opts);
      assert.deepEqual(res, [ 1, 2, 49, 800, 555 ]);
    });

    it('unresolved', () => {
      const src = '[1,2,3+4*10*z+n,foo(3+5),obj[""+"x"].y]';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, {
        n: 6,
        foo: function(x) { return x * 100; },
        obj: { x: { y: 555 } }
      }, opts);
      assert.equal(res, undefined);
    });

    it('boolean', () => {
      const src = '[ 1===2+3-16/4, [2]==2, [2]!==2, [2]!==[2], "2"==2 ]';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(evaluate.sync(ast, {}, opts), [ true, true, true, true, true ]);
    });

    it('ObjectExpression', () => {
      const src = '({ a: "b", c: "d" }) ';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(evaluate.sync(ast), { a: 'b', c: 'd' });
    });

    it('array methods', () => {
      const src = '[1, 2, 3].map(function(n) { return n * 2 })';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(evaluate.sync(ast, {}, opts), [2, 4, 6]);
    });

    it('array methods invocation count', () => {
      const variables = { values: [1, 2, 3], receiver: [] };
      const src = 'values.forEach(function(x) { receiver.push(x); })';
      const ast = parse(src).body[0].expression;
      evaluate.sync(ast, variables, opts);
      assert.equal(variables.receiver.length, 3);
      assert.deepEqual(variables.receiver, [1, 2, 3]);
    });

    it('array methods with vars', () => {
      const src = '[1, 2, 3].map(function(n) { return n * x })';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(evaluate.sync(ast, { x: 2 }, opts), [2, 4, 6]);
    });

    it('evaluate this', () => {
      const src = 'this.x + this.y.z';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, {
        'this': { x: 1, y: { z: 100 } }
      }, opts);
      assert.equal(res, 101);
    });

    it('FunctionExpression unresolved', () => {
      const src = '(function(){console.log("Not Good")})';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('ArrowFunctionExpression unresolved', () => {
      const src = '(() => {console.log("Not Good")})';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('MemberExpressions from Functions unresolved', () => {
      const src = '(function () {}).constructor';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('disallow accessing constructor or __proto__', () => {
      const someValue = {};

      let src = 'object.constructor';
      let ast = parse(src).body[0].expression;
      let res = evaluate.sync(ast, { object: someValue }, opts);
      assert.equal(res, undefined);

      src = 'object["constructor"]';
      ast = parse(src).body[0].expression;
      res = evaluate.sync(ast, { object: someValue }, opts);
      assert.equal(res, undefined);

      src = 'object.__proto__';
      ast = parse(src).body[0].expression;
      res = evaluate.sync(ast, { object: someValue }, opts);
      assert.equal(res, undefined);

      src = 'object["__pro"+"t\x6f__"]';
      ast = parse(src).body[0].expression;
      res = evaluate.sync(ast, { object: someValue }, opts);
      assert.equal(res, undefined);
    });

    it('constructor at runtime only', () => {
      const log = console.log;
      const logged = [];
      console.log = v => logged.push(v);
      let src = '(function myTag(y){return ""[!y?"__proto__":"constructor"][y]})("constructor")("console.log(process.env)")()';
      let ast = parse(src).body[0].expression;
      let res = evaluate.sync(ast, {}, opts);
      assert.equal(res, undefined);
      console.log = log;
      assert(logged.includes(process.env));

      src = '(function(prop) { return {}[prop ? "benign" : "constructor"][prop] })("constructor")("alert(1)")()';
      ast = parse(src).body[0].expression;
      res = evaluate.sync(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('short circuit evaluation AND', () => {
      const variables = { value: null };
      const src = 'value && value.func()';
      const ast = parse(src).body[0].expression;
      const res = evaluate.sync(ast, variables, opts);
      assert.equal(res, null);
    });

    it('short circuit evaluation OR', () => {
      let fnInvoked = false;
      const variables = {
        value: true,
        fn: function() { (fnInvoked = true); }
      };
      const src = 'value || fn()';
      const ast = parse(src).body[0].expression;
      evaluate.sync(ast, variables, opts);
      assert.equal(fnInvoked, false);
    });

    it('function declaration does not invoke CallExpressions', () => {
      let invoked = false;
      const variables = {
        noop: function() {},
        onInvoke: function() { invoked = true; }
      };
      const src = 'noop(function(){ onInvoke(); })';
      const ast = parse(src).body[0].expression;
      evaluate.sync(ast, variables, opts);
      assert.equal(invoked, false);
    });
  });

  describe('async', () => {
    it('resolved', async () => {
      const src = '[1,2,3+4*10+(n||6),foo(3+5),obj[""+"x"].y]';
      const ast = parse(src).body[0].expression;
      const res = await evaluate(ast, {
        n: false,
        foo: function(x) { return x * 100; },
        obj: { x: { y: 555 } }
      }, opts);
      assert.deepEqual(res, [ 1, 2, 49, 800, 555 ]);
    });

    it('unresolved', async () => {
      const src = '[1,2,3+4*10*z+n,foo(3+5),obj[""+"x"].y]';
      const ast = parse(src).body[0].expression;
      const res = await evaluate(ast, {
        n: 6,
        foo: function(x) { return x * 100; },
        obj: { x: { y: 555 } }
      }, opts);
      assert.equal(res, undefined);
    });

    it('boolean', async () => {
      const src = '[ 1===2+3-16/4, [2]==2, [2]!==2, [2]!==[2] ]';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(await evaluate(ast, {}, opts), [ true, true, true, true ]);
    });

    it('array methods', async () => {
      const src = '[1, 2, 3].map(function(n) { return n * 2 })';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(await evaluate(ast, {}, opts), [2, 4, 6]);
    });

    it('array methods invocation count', async () => {
      const variables = {
        values: [1, 2, 3],
        receiver: []
      };
      const src = 'values.forEach(function(x) { receiver.push(x); })';
      const ast = parse(src).body[0].expression;
      await evaluate(ast, variables, opts);
      assert.equal(variables.receiver.length, 3);
      assert.deepEqual(variables.receiver, [1, 2, 3]);
    });

    it('array methods with vars', async () => {
      const src = '[1, 2, 3].map(function(n) { return n * x })';
      const ast = parse(src).body[0].expression;
      assert.deepEqual(await evaluate(ast, { x: 2 }, opts), [2, 4, 6]);
    });

    it('array methods with fat arrow function', async () => {
      const ast = parse('[1, 2, 3].map((n) => { return n * x })').body[0].expression;
      assert.deepEqual(await evaluate(ast, { x: 2 }, opts), [2, 4, 6]);

      const ast2 = parse('[1, 2, 3].map(n => n * x);').body[0].expression;
      assert.deepEqual(await evaluate(ast2, { x: 2 }, opts), [2, 4, 6]);
    });

    it('evaluate this', async () => {
      const src = 'this.x + this.y.z';
      const ast = parse(src).body[0].expression;
      const res = await evaluate(ast, { 'this': { x: 1, y: { z: 100 } } }, opts);
      assert.equal(res, 101);
    });

    it('FunctionExpression unresolved', async () => {
      const src = '(function(){console.log("Not Good")})';
      const ast = parse(src).body[0].expression;
      const res = await evaluate(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('MemberExpressions from Functions unresolved', async () => {
      const src = '(function () {}).constructor';
      const ast = parse(src).body[0].expression;
      const res = await evaluate(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('disallow accessing constructor or __proto__', async () => {
      const someValue = {};

      let src = 'object.constructor';
      let ast = parse(src).body[0].expression;
      let res = await evaluate(ast, { object: someValue }, opts);
      assert.equal(res, undefined);

      src = 'object["constructor"]';
      ast = parse(src).body[0].expression;
      res = await evaluate(ast, { object: someValue }, opts);
      assert.equal(res, undefined);

      src = 'object.__proto__';
      ast = parse(src).body[0].expression;
      res = await evaluate(ast, { object: someValue }, opts);
      assert.equal(res, undefined);

      src = 'object["__pro"+"t\x6f__"]';
      ast = parse(src).body[0].expression;
      res = await evaluate(ast, { object: someValue }, opts);
      assert.equal(res, undefined);
    });

    it('constructor at runtime only', async () => {
      const log = console.log;
      const logged = [];
      console.log = v => logged.push(v);
      let src = '(function myTag(y){return ""[!y?"__proto__":"constructor"][y]})("constructor")("console.log(process.env)")()';
      let ast = parse(src).body[0].expression;
      let res = await evaluate(ast, {}, opts);
      assert.equal(res, undefined);
      console.log = log;
      assert(logged.includes(process.env));

      src = '(function(prop) { return {}[prop ? "benign" : "constructor"][prop] })("constructor")("alert(1)")()';
      ast = parse(src).body[0].expression;
      res = await evaluate(ast, {}, opts);
      assert.equal(res, undefined);
    });

    it('short circuit evaluation AND', async () => {
      const variables = {
        value: null
      };
      const src = 'value && value.func()';
      const ast = parse(src).body[0].expression;
      const res = await evaluate(ast, variables, opts);
      assert.equal(res, null);
    });

    it('short circuit evaluation OR', async () => {
      let fnInvoked = false;
      const variables = {
        value: true,
        fn: function() { (fnInvoked = true); }
      };
      const src = 'value || fn()';
      const ast = parse(src).body[0].expression;
      await evaluate(ast, variables, opts);
      assert.equal(fnInvoked, false);
    });

    it('function declaration does not invoke CallExpressions', async () => {
      let invoked = false;
      const variables = {
        noop: function() {},
        onInvoke: function() { invoked = true; }
      };
      const src = 'noop(function(){ onInvoke(); })';
      const ast = parse(src).body[0].expression;
      await evaluate(ast, variables, opts);
      assert.equal(invoked, false);
    });

    it('fat arrow function declaration does not invoke CallExpressions', async () => {
      let invoked = false;
      const variables = {
        noop: function() {},
        onInvoke: function() { invoked = true; }
      };
      const src = 'noop(() => { onInvoke(); })';
      const ast = parse(src).body[0].expression;
      await evaluate(ast, variables, opts);
      assert.equal(invoked, false);
    });
  });
});
