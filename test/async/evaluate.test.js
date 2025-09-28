'use strict';

const { strict: assert } = require('assert');
const { evaluate } = require('../support');

const opts = { functions: true, allowAwaitOutsideFunction: true };
const e = (input, data, options) => evaluate(input, data, { ...opts, ...options });
e.sync = (input, data, options) => evaluate.sync(input, data, { ...opts, ...options });

describe('evaluate', () => {
  describe('async', async () => {
    it('should compare numbers', async () => {
      assert(await e('9 === 9'));
      assert(!await e('9 === 8'));
      assert(await e('9 > 8'));
      assert(!await e('9 < 8'));
      assert(!await e('9 <= 8'));
      assert(await e('-.1 >= -.2'));
      assert(await e('-0.1 >= -0.2'));
      assert(await e('-1 >= -2'));
      assert(await e('+1 <= +2'));
      assert(await e('9 >= 8'));
      assert(await e('9.1 >= 9.01'));
      assert(await e('-1 === -1'));
    });

    it('should compare booleans', async () => {
      assert(await e('false !== "false"'));
      assert(await e('false != "false"'));
      assert(await e('false === false'));
      assert(await e('true !== "true"'));
      assert(await e('true != "true"'));
      assert(await e('true === true'));

      assert(!await e('true === false'));
      assert(!await e('true===false'));

      assert(!await e('false || false'));
      assert(!await e('false||false'));

      assert(await e('true || false'));
      assert(await e('true||false'));

      assert(await e('true || true'));
      assert(await e('true||true'));

      assert(!await e('false && false'));
      assert(!await e('false&&false'));

      assert(!await e('true && false'));
      assert(!await e('true&&false'));

      assert(await e('true && true'));
      assert(await e('true&&true'));
    });

    it('should compare strings', async () => {
      assert(await e('"foo" === "foo"'));
      assert(await e('"bar" === "bar"'));

      assert(!await e('"bar" === "foo"'));
      assert(!await e('"bar"==="foo"'));

      assert(await e('"foo" || "foo"'));
      assert(await e('"foo"||"foo"'));

      assert(await e('"bar" || "foo"'));
      assert(await e('"bar"||"foo"'));

      assert(await e('"bar" || "bar"'));
      assert(await e('"bar"||"bar"'));

      assert(await e('"foo" && "foo"'));
      assert(await e('"foo"&&"foo"'));

      assert(await e('"bar" && "foo"'));
      assert(await e('"bar"&&"foo"'));

      assert(await e('"bar" && "bar"'));
      assert(await e('"bar"&&"bar"'));
    });

    it('should support null and undefined', async () => {
      assert.equal(await e('void (0)'), undefined);
      assert.equal(await e('void (42)'), undefined);
      assert.equal(await e('void 42'), undefined);
      assert.equal(await e('void 0'), undefined);
      assert.equal(await e('undefined'), undefined);
      assert.equal(await e('null'), null);
      assert.equal(await e('"null"'), 'null');
    });

    it('should compare null and undefined', async () => {
      assert(await e('undefined === void (0)'));
      assert(await e('undefined === void (42)'));
      assert(await e('undefined === void 42'));
      assert(await e('undefined === void 0'));
      assert(await e('undefined === undefined'));
      assert(await e('null === null'));
      assert(!await e('undefined === null'));
    });

    it('should support unary operators', async () => {
      assert.equal(await e('-9'), -9);
      assert.equal(await e('+9'), 9);
    });

    it('should use unary operators on nested properties', async () => {
      const context = {
        a: { b: { c: '10' } }
      };
      assert.equal(await e('-a.b.c', context), -10);
    });

    it('should return void', async () => {
      assert.equal(await e('void 1'), undefined);
      assert.equal(await e('void "1"'), undefined);
      assert.equal(await e('void null'), undefined);
      assert.equal(await e('void "null"'), undefined);
      assert.equal(await e('void true'), undefined);
      assert.equal(await e('void false'), undefined);
    });

    it('should return the type of value', async () => {
      assert.equal(await e('typeof 1'), 'number');
      assert.equal(await e('typeof "1"'), 'string');
      assert.equal(await e('typeof null'), 'object');
      assert.equal(await e('typeof "null"'), 'string');
      assert.equal(await e('typeof true'), 'boolean');
      assert.equal(await e('typeof false'), 'boolean');
    });

    it('should do comparisons with typeof', async () => {
      assert(await e('typeof 1 === "number"'));
      assert(await e('typeof "foo" === "string"'));
      assert(!await e('typeof "foo" !== "string"'));
      assert(!await e('typeof "bar" === "number"'));
      assert(await e('typeof "baz" !== "number"'));
      assert(await e('typeof "foo" === typeof "baz"'));
      assert(await e('typeof 9 === typeof 10'));
      assert(!await e('typeof 9 === typeof "bar"'));
      assert(!await e('typeof 9 === typeof "baz"'));
      assert(await e('typeof "num" !== typeof -9'));
      assert(await e('typeof "foo" == typeof "baz"'));
      assert(await e('typeof 9 == typeof 10'));
      assert(!await e('typeof 9 == typeof "bar"'));
    });

    it('should compare values with unary operators', async () => {
      assert(!await e('typeof -9 === typeof "baz"'));
      assert(!await e('typeof +9 !== typeof -9'));
      assert(await e('+9 !== -9'));
      assert(await e('+9 === +9'));
      assert(await e('-9 === -9'));
      assert(!await e('+9 !== +9'));
      assert(!await e('-9 !== -9'));
    });

    it('should support multiple comparisons with &&', async () => {
      assert(await e('1 !== 2 && 5 === 5'));
      assert(await e('(1 !== 2) && (5 === 5)'));
      assert(await e('(1 !== 2) && (5 === 5) && ("foo" !== "bar")'));
    });

    it('should support multiple comparisons with ||', async () => {
      assert(await e('1 !== 2 || 5 === 5'));
      assert(await e('(1 !== 2) || (5 === 5)'));
      assert(await e('(1 !== 2) || (5 === 5) || ("foo" !== "bar")'));
    });

    it('should support multiple comparisons with || and &&', async () => {
      assert(await e('(1 !== 2 || 5 === 5) && "foo" !== true'));
      assert(await e('(1 === 2 || 5 === 5) && "foo" !== true'));
      assert(!await e('(1 !== 2) && (0 && 5)'));
      assert(await e('(1 !== 2) && (0 || 5)'));
      assert(await e('(1 !== 2) || (5 === 5) && ("foo" !== "bar")'));
      assert(await e('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))'));
      assert(await e('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))'));
    });

    it('should support negated conditions', async () => {
      assert(!await e('!value', { value: 'abc' }));
      assert(await e('!!value', { value: 'abc' }));
      assert(await e('value === "abc"', { value: 'abc' }));
      assert(!await e('!!value === false', { value: 'abc' }));
      assert(!await e('!value === true', { value: 'abc' }));
      assert(await e('!!value === true', { value: 'abc' }));
      assert(await e('!value === false', { value: 'abc' }));
      assert(!await e('(value === false)', { value: 'abc' }));
      assert(await e('!(value === false)', { value: 'abc' }));
      assert(!await e('!!(value === false)', { value: 'abc' }));
    });

    it('should support functions', async () => {
      const fn = (input, context, options) => e(input, context, { ...options, functions: true });
      const context = {
        a: 1,
        b: 1,
        c: 'foo',
        isEqual(a, b) {
          return a === b;
        },
        allEqual(...args) {
          return args.every(e => e === args[0]);
        }
      };

      assert(!await fn('allEqual("foo", "foo", "bar")', context));
      assert(await fn('allEqual("foo", "foo", "foo")', context));
      assert(await fn('isEqual("foo", "foo")', context));
      assert(await fn('isEqual(a, b)', context));
      assert(!await fn('isEqual(b, c)', context));
      assert(!await fn('allEqual(a, b, c)', context));
      assert(!await fn('allEqual(a, b, b, a, b, a, c)', context));
      assert(await fn('allEqual(isEqual(a, b), isEqual(b, b))', context));
      assert(!await fn('allEqual(isEqual(a, b), isEqual(b, c))', context));
    });

    it('should support multiple comparisons a context', async () => {
      const context = {
        a: 1,
        b: 1,
        c: 'foo',
        foo: 'This is foo!',
        bar: 8,
        baz: 'qux',
        bool: true,
        num: '-9',
        d: { e: { f: '21' } },
        x: { y: { z: 42 } },
        focused: { editable: true },
        string: false
      };

      assert(await e('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context));
      assert(await e('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context));
      assert(await e('typeof foo === "string"', context));
      assert(await e('((typeof foo === "string") && (typeof bar !== "string"))', context));
      assert(await e('((baz === "qux") && (a <= b) || (c >= d) || (e > f))', context));
      assert(await e('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))', context));
      assert(await e('typeof +d.e.f === typeof x.y.z', context));
      assert(await e('typeof +d.e.f === typeof 10', context));
      assert.equal(await e('string || focused.editable', context), true);
      assert.equal(await e('string && focused.editable', context), false);
      assert.equal(await e('!!(string && focused.editable)', context), false);
    });

    describe('objects', () => {
      it('should return object literals', async () => {
        assert.deepEqual(await e('({ p })', { p: 'item_' }), { p: 'item_' });
        assert.deepEqual(await e('({ p: p })', { p: 'item_' }), { p: 'item_' });
        assert.deepEqual(await e('({ a: 1, b: 2 })'), { a: 1, b: 2 });
        assert.deepEqual(await e('({ a: 1, b: { c: 3 } })'), { a: 1, b: { c: 3 } });
        assert.deepEqual(await e('({ a: 1, b: { c: { d: 4 } } })'), { a: 1, b: { c: { d: 4 } } });
      });
    });
  });

  describe('sync', () => {
    it('should compare numbers', () => {
      assert(e.sync('9 === 9'));
      assert(!e.sync('9 === 8'));
      assert(e.sync('9 > 8'));
      assert(!e.sync('9 < 8'));
      assert(!e.sync('9 <= 8'));
      assert(e.sync('-.1 >= -.2'));
      assert(e.sync('-0.1 >= -0.2'));
      assert(e.sync('-1 >= -2'));
      assert(e.sync('+1 <= +2'));
      assert(e.sync('9 >= 8'));
      assert(e.sync('9.1 >= 9.01'));
      assert(e.sync('-1 === -1'));
    });

    it('should compare booleans', () => {
      assert(e.sync('false === false'));
      assert(e.sync('true === true'));
      assert(!e.sync('true === false'));
      assert(!e.sync('true===false'));
      assert(!e.sync('false || false'));
      assert(!e.sync('false||false'));
      assert(e.sync('true || false'));
      assert(e.sync('true||false'));
      assert(e.sync('true || true'));
      assert(e.sync('true||true'));
      assert(!e.sync('false && false'));
      assert(!e.sync('false&&false'));
      assert(!e.sync('true && false'));
      assert(!e.sync('true&&false'));
      assert(e.sync('true && true'));
      assert(e.sync('true&&true'));
      assert(e.sync('false === false'));
    });

    it('should compare strings', () => {
      assert(e.sync('"foo" === "foo"'));
      assert(e.sync('"bar" === "bar"'));

      assert(!e.sync('"bar" === "foo"'));
      assert(!e.sync('"bar"==="foo"'));

      assert(e.sync('"foo" || "foo"'));
      assert(e.sync('"foo"||"foo"'));

      assert(e.sync('"bar" || "foo"'));
      assert(e.sync('"bar"||"foo"'));

      assert(e.sync('"bar" || "bar"'));
      assert(e.sync('"bar"||"bar"'));

      assert(e.sync('"foo" && "foo"'));
      assert(e.sync('"foo"&&"foo"'));

      assert(e.sync('"bar" && "foo"'));
      assert(e.sync('"bar"&&"foo"'));

      assert(e.sync('"bar" && "bar"'));
      assert(e.sync('"bar"&&"bar"'));
    });

    it('should support null and undefined', () => {
      assert.equal(e.sync('void (0)'), undefined);
      assert.equal(e.sync('void (42)'), undefined);
      assert.equal(e.sync('void 42'), undefined);
      assert.equal(e.sync('void 0'), undefined);
      assert.equal(e.sync('undefined'), undefined);
      assert.equal(e.sync('null'), null);
      assert.equal(e.sync('"null"'), 'null');
    });

    it('should compare null and undefined', () => {
      assert(e.sync('undefined === void (0)'));
      assert(e.sync('undefined === void (42)'));
      assert(e.sync('undefined === void 42'));
      assert(e.sync('undefined === void 0'));
      assert(e.sync('undefined === undefined'));
      assert(e.sync('null === null'));
      assert(!e.sync('undefined === null'));
    });

    it('should support unary operators', () => {
      assert.equal(e.sync('-9'), -9);
      assert.equal(e.sync('+9'), 9);
    });

    it('should use unary operators on nested properties', () => {
      const context = {
        a: { b: { c: '10' } }
      };
      assert.equal(e.sync('-a.b.c', context), -10);
    });

    it('should return the type of value', () => {
      assert.equal(e.sync('typeof 1'), 'number');
      assert.equal(e.sync('typeof "1"'), 'string');
      assert.equal(e.sync('typeof null'), 'object');
      assert.equal(e.sync('typeof "null"'), 'string');
      assert.equal(e.sync('typeof true'), 'boolean');
      assert.equal(e.sync('typeof false'), 'boolean');
    });

    it('should do comparisons with typeof', () => {
      assert(e.sync('typeof 1 === "number"'));
      assert(e.sync('typeof "foo" === "string"'));
      assert(!e.sync('typeof "foo" !== "string"'));
      assert(!e.sync('typeof "bar" === "number"'));
      assert(e.sync('typeof "baz" !== "number"'));
      assert(e.sync('typeof "foo" === typeof "baz"'));
      assert(e.sync('typeof 9 === typeof 10'));
      assert(!e.sync('typeof 9 === typeof "bar"'));
      assert(!e.sync('typeof 9 === typeof "baz"'));
      assert(e.sync('typeof "num" !== typeof -9'));
      assert(e.sync('typeof "foo" == typeof "baz"'));
      assert(e.sync('typeof 9 == typeof 10'));
      assert(!e.sync('typeof 9 == typeof "bar"'));
    });

    it('should compare values with unary operators', () => {
      assert(!e.sync('typeof -9 === typeof "baz"'));
      assert(!e.sync('typeof +9 !== typeof -9'));
      assert(e.sync('+9 !== -9'));
      assert(e.sync('+9 === +9'));
      assert(e.sync('-9 === -9'));
      assert(!e.sync('+9 !== +9'));
      assert(!e.sync('-9 !== -9'));
    });

    it('should support multiple comparisons with &&', () => {
      assert(e.sync('1 !== 2 && 5 === 5'));
      assert(e.sync('(1 !== 2) && (5 === 5)'));
      assert(e.sync('(1 !== 2) && (5 === 5) && ("foo" !== "bar")'));
    });

    it('should support multiple comparisons with ||', () => {
      assert(e.sync('1 !== 2 || 5 === 5'));
      assert(e.sync('(1 !== 2) || (5 === 5)'));
      assert(e.sync('(1 !== 2) || (5 === 5) || ("foo" !== "bar")'));
    });

    it('should support multiple comparisons with || and &&', () => {
      assert(e.sync('(1 !== 2 || 5 === 5) && "foo" !== true'));
      assert(e.sync('(1 === 2 || 5 === 5) && "foo" !== true'));
      assert(!e.sync('(1 !== 2) && (0 && 5)'));
      assert(e.sync('(1 !== 2) && (0 || 5)'));
      assert(e.sync('(1 !== 2) || (5 === 5) && ("foo" !== "bar")'));
      assert(e.sync('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))'));
      assert(e.sync('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))'));
    });

    it('should support negated conditions', () => {
      assert(!e.sync('!value', { value: 'abc' }));
      assert(e.sync('!!value', { value: 'abc' }));
      assert(e.sync('value === "abc"', { value: 'abc' }));
      assert(!e.sync('!!value === false', { value: 'abc' }));
      assert(!e.sync('!value === true', { value: 'abc' }));
      assert(e.sync('!!value === true', { value: 'abc' }));
      assert(e.sync('!value === false', { value: 'abc' }));
      assert(!e.sync('(value === false)', { value: 'abc' }));
      assert(e.sync('!(value === false)', { value: 'abc' }));
      assert(!e.sync('!!(value === false)', { value: 'abc' }));
    });

    it('should get values from the context', () => {
      assert.deepEqual(e.sync('a', { a: { b: { c: 'correct' } } }), { b: { c: 'correct' } });
      assert.deepEqual(e.sync('a.b', { a: { b: { c: 'correct' } } }), { c: 'correct' });
      assert.deepEqual(e.sync('a.b.c', { a: { b: { c: 'correct' } } }), 'correct');
      assert.deepEqual(e.sync('[a.b.c]', { a: { b: { c: 'correct' } } }), ['correct']);

      const env = { USER: 'temp' };
      assert.equal(e.sync('env.USER', { env }), 'temp');
      assert(e.sync('env.USER === "temp"', { env }));
      assert(e.sync('env.USER !== "jon"', { env }));
      assert(!e.sync('env.USER !== "temp"', { env }));
    });

    it('should support functions', () => {
      const fn = (input, context, options) => e.sync(input, context, { ...options, functions: true });
      const context = {
        a: 1,
        b: 1,
        c: 'foo',
        isEqual(a, b) {
          return a === b;
        },
        allEqual(...args) {
          return args.every(e => e === args[0]);
        }
      };

      assert(!fn('allEqual("foo", "foo", "bar")', context));
      assert(fn('allEqual("foo", "foo", "foo")', context));
      assert(fn('isEqual("foo", "foo")', context));
      assert(fn('isEqual(a, b)', context));
      assert(!fn('isEqual(b, c)', context));
      assert(!fn('allEqual(a, b, c)', context));
      assert(!fn('allEqual(a, b, b, a, b, a, c)', context));
      assert(fn('allEqual(isEqual(a, b), isEqual(b, b))', context));
      assert(!fn('allEqual(isEqual(a, b), isEqual(b, c))', context));
    });

    it('should support multiple comparisons a context', () => {
      const context = {
        a: 1,
        b: 1,
        c: 'foo',
        foo: 'This is foo!',
        bar: 8,
        baz: 'qux',
        bool: true,
        num: '-9',
        d: { e: { f: '21' } },
        x: { y: { z: 42 } },
        focused: { editable: true },
        string: false
      };

      assert(e.sync('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context));
      assert(e.sync('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context));
      assert(e.sync('((typeof foo === "string") && (typeof bar !== "string"))', context));
      assert(e.sync('((baz === "qux") && (a <= b) || (c >= d) || (e > f))', context));
      assert(e.sync('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))', context));
      assert(e.sync('typeof +d.e.f === typeof x.y.z', context));
      assert(e.sync('typeof +d.e.f === typeof 10', context));
      assert.equal(e.sync('string || focused.editable', context), true);
      assert.equal(e.sync('string && focused.editable', context), false);
      assert.equal(e.sync('!!(string && focused.editable)', context), false);
    });
  });
});
