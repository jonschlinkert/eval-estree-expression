'use strict';

const assert = require('node:assert/strict');
const { evaluate: e, expression } = require('../support');

describe('operators (sync)', () => {
  describe('performance', () => {
    it('should evaluate 10,000 times', () => {
      const start = Date.now();

      for (let i = 0; i < 10_000; i++) {
        e.sync('2 / 1 * 4 / 2');
      }

      const end = Date.now();
      assert.ok(end - start < 500, 'Performance test failed');
    });

    it('should pre-parse and evaluate 10,000 times', () => {
      const start = Date.now();
      const exp = expression.sync('2 / 1 * 4 / 2');

      for (let i = 0; i < 10_000; i++) {
        exp('2 / 1 * 4 / 2');
      }

      const end = Date.now();
      assert.ok(end - start < 500, 'Performance test failed');
    });
  });

  describe('regex operator', () => {
    it('should evaluate custom regex operator for matching without functions', () => {
      assert.ok(e.sync('name =~ /^a.*c$/', { name: 'abc' }));
      assert.ok(!e.sync('name =~ /^d.*f$/', { name: 'abc' }));

      assert.ok(e.sync('name =~ regex', { name: 'abc', regex: /^a.*c$/ }));
      assert.ok(!e.sync('name =~ regex', { name: 'abc', regex: /^d.*f$/ }));
    });

    it('should throw whe regex operator is disabled', () => {
      assert.throws(() => e.sync('name =~ /^a.*c$/', { name: 'abc' }, { regexOperator: false }));
    });
  });

  describe('grouping operators', () => {
    it('should evaluate grouping operators', () => {
      assert.equal(e.sync('2 / 1 * 4 / 2'), 4);
      assert.equal(e.sync('2 / (1 * 4) / 2'), 0.25);
      assert.equal(e.sync('(2 / 1) + (4 / 2)'), 4);
      assert.equal(e.sync('2 / (1 + 4) / 2'), 0.2);
    });
  });

  describe('increment and decrement operators', () => {
    it('should evaluate increment prefix operator', () => {
      assert.equal(e.sync('++a', { a: 1 }), 2);
      assert.equal(e.sync('++a', { a: -1 }), 0);
    });

    it('should evaluate increment postfix operator', () => {
      assert.equal(e.sync('a++', { a: 1 }), 2);
      assert.equal(e.sync('a++', { a: -1 }), 0);
    });

    it('should evaluate decrement prefix operator', () => {
      assert.equal(e.sync('--a', { a: 1 }), 0);
      assert.equal(e.sync('--a', { a: 0 }), -1);
    });

    it('should evaluate decrement postfix operator', () => {
      assert.equal(e.sync('a--', { a: 1 }), 0);
      assert.equal(e.sync('a--', { a: 0 }), -1);
    });
  });

  describe('unary operators', () => {
    it('should evaluate delete', () => {
      const context = { obj: { a: 1, b: 2 } };
      e.sync('delete obj.b', context);
      assert.deepEqual(context, { obj: { a: 1 } });
    });

    it('should throw an error when delete is invalid', () => {
      assert.throws(() => e.sync('delete obj', { obj: {} }));
    });

    it('should evaluate void', () => {
      assert.equal(e.sync('void 42'), undefined);
      assert.equal(e.sync('void (42)'), undefined);
    });

    it('should evaluate typeof', () => {
      assert.equal(e.sync('typeof 42'), 'number');
      assert.equal(e.sync('typeof "42"'), 'string');
    });

    it('should evaluate +', () => {
      assert.equal(e.sync('+"42"'), 42);
      assert.equal(e.sync('+"string"'), NaN);
    });

    it('should evaluate -', () => {
      assert.equal(e.sync('-"42"'), -42);
      assert.equal(e.sync('-"42n"'), NaN);
      assert.equal(e.sync('-42n'), -42n);
      assert.equal(e.sync('-42'), -42);
    });

    it('should evaluate ~', () => {
      assert.equal(e.sync('~a', { a: 5, b: -3 }), -6);
      assert.equal(e.sync('~b', { a: 5, b: -3 }), 2);
    });

    it('should evaluate !', () => {
      assert.equal(e.sync('!a', { a: 5, b: -3 }), false);
      assert.equal(e.sync('!b', { a: 5, b: -3 }), false);
      assert.equal(e.sync('!b', { a: 5, b: 0 }), true);
      assert.equal(e.sync('!b', { a: 5, b: false }), true);

      assert.equal(e.sync('!!a', { a: 5, b: -3 }), true);
      assert.equal(e.sync('!!b', { a: 5, b: -3 }), true);
      assert.equal(e.sync('!!b', { a: 5, b: 0 }), false);
      assert.equal(e.sync('!!b', { a: 5, b: false }), false);

      assert.equal(e.sync('!!!!!a', { a: 5, b: -3 }), false);
      assert.equal(e.sync('!!!!!b', { a: 5, b: -3 }), false);
      assert.equal(e.sync('!!!!!b', { a: 5, b: 0 }), true);
      assert.equal(e.sync('!!!!!b', { a: 5, b: false }), true);
    });
  });

  describe('arithmetic operators', () => {
    it('should evaluate +', () => {
      assert.equal(e.sync('1 + 1'), 2);
      assert.equal(e.sync('1 + a', { a: 1 }), 2);
      assert.equal(e.sync('a + b', { a: 1, b: 9 }), 10);
      assert.equal(e.sync('products.amount * 0.06', { products: { amount: 100 } }), 6);
    });

    it('should evaluate -', () => {
      assert.equal(e.sync('1 - 1'), 0);
      assert.equal(e.sync('1 - 2'), -1);
      assert.equal(e.sync('1 - a', { a: 2 }), -1);
    });

    it('should evaluate /', () => {
      assert.equal(e.sync('5 / 2'), 2.5);
      assert.equal(e.sync('1 / 2'), 0.5);
    });

    it('should evaluate *', () => {
      assert.equal(e.sync('a * 2', { a: 3.1 }), 6.2);
      assert.equal(e.sync('a * b', { a: 3.1, b: 3 }), 9.3);
    });

    it('should evaluate %', () => {
      assert.equal(e.sync('12 % 5'), 2);
      assert.equal(e.sync('-12 % 5'), -2);
    });

    it('should evaluate **', () => {
      assert.equal(e.sync('3 ** 4'), 81);
      assert.equal(e.sync('10 ** -2'), 0.01);
      assert.equal(e.sync('2 ** 3 ** 2'), 512);
      assert.equal(e.sync('(2 ** 3) ** 2'), 64);
    });
  });

  describe('relational operators', () => {
    it('should evaluate in', () => {
      assert.equal(e.sync('"a" in ["a", "b"]'), true);
      assert.equal(e.sync('"a" in { a: "b" }'), true);
      assert.equal(e.sync('"a" in obj', { obj: { a: 'b' } }), true);
    });

    it('should evaluate instanceof', () => {
      class Foo {}
      class Bar {}
      const a = new Foo();
      assert.equal(e.sync('a instanceof Foo', { Foo, a }), true);
      assert.equal(e.sync('a instanceof Bar', { Bar, Foo, a }), false);
    });

    it('should evaluate <', () => {
      assert.equal(e.sync('1 < 1'), false);
      assert.equal(e.sync('1 < 2'), true);
      assert.equal(e.sync('1 < 0'), false);
    });

    it('should evaluate >', () => {
      assert.equal(e.sync('1 > 1'), false);
      assert.equal(e.sync('1 > 2'), false);
      assert.equal(e.sync('1 > 0'), true);
    });

    it('should evaluate <=', () => {
      assert.equal(e.sync('1 <= 1'), true);
      assert.equal(e.sync('1 <= 2'), true);
      assert.equal(e.sync('1 <= 0'), false);
    });

    it('should evaluate >=', () => {
      assert.equal(e.sync('1 >= 1'), true);
      assert.equal(e.sync('1 >= 2'), false);
      assert.equal(e.sync('1 >= 0'), true);
    });
  });

  describe('equality operators', () => {
    it('should evaluate !==', () => {
      assert.equal(e.sync('v !== undefined', { v: null }), true);
      assert.equal(e.sync('v !== undefined', { v: undefined }), false);
      assert.equal(e.sync('v !== undefined'), false);
      assert.equal(e.sync('5 !== 2'), true);
      assert.equal(e.sync('7 !== 7'), false);
      assert.equal(e.sync('1 !== 2'), true);
      assert.equal(e.sync('1 !== 1'), false);
      assert.equal(e.sync('a !== b', { a: 1, b: 2 }), true);
      assert.equal(e.sync('a !== b', { a: 2, b: 2 }), false);
      assert.equal(e.sync('"one" !== "two"'), true);
    });

    it('should evaluate ===', () => {
      assert.equal(e.sync('"" === ""'), true);
      assert.equal(e.sync('"one" === "two"'), false);
      assert.equal(e.sync('v === undefined', { v: null }), false);
      assert.equal(e.sync('v === undefined', { v: undefined }), true);
      assert.equal(e.sync('v === undefined', { v: 1, undefined: 1 }), false);
      assert.equal(e.sync('v === undefined'), true);

      assert.equal(e.sync('a.b === undefined', { a: { b: null } }), false);
      assert.equal(e.sync('a.b === undefined', { a: { b: undefined } }), true);
      assert.equal(e.sync('a.b === undefined', { a: { b: 1, undefined: 1 } }), false);
      assert.equal(e.sync('a.b === undefined', { a: {} }), true);

      assert.equal(e.sync('undefined === null'), false);
      assert.equal(e.sync('5 === 2'), false);
      assert.equal(e.sync('1 === 2'), false);
      assert.equal(e.sync('1 === 1'), true);
      assert.equal(e.sync('7 === 7'), true);
      assert.equal(e.sync('a === b', { a: 1, b: 2 }), false);
      assert.equal(e.sync('a === b', { a: 2, b: 2 }), true);
    });

    it('should evaluate !=', () => {
      assert.equal(e.sync('5 != 2'), true);
      assert.equal(e.sync('7 != "7"'), false);
      assert.equal(e.sync('1 != 2'), true);
      assert.equal(e.sync('1 != 1'), false);
      assert.equal(e.sync('a != b', { a: 1, b: '2' }), true);
      assert.equal(e.sync('a != b', { a: 2, b: '2' }), false);
      assert.equal(e.sync('"one" != "two"'), true);
    });

    it('should evaluate ==', () => {
      assert.equal(e.sync('undefined == null'), true);
      assert.equal(e.sync('"1" == 1'), true);
      assert.equal(e.sync('5 == 2'), false);
      assert.equal(e.sync('7 == "7"'), true);
      assert.equal(e.sync('1 == 2'), false);
      assert.equal(e.sync('1 == 1'), true);
      assert.equal(e.sync('a == b', { a: 1, b: '2' }), false);
      assert.equal(e.sync('a == b', { a: 2, b: '2' }), true);
      assert.equal(e.sync('"one" == "two"'), false);
      assert.equal(e.sync('"" == ""'), true);
    });
  });

  describe('bitwise shift operators', () => {
    it('should evaluate <<', () => {
      assert.equal(e.sync('9 << 3'), 72);
    });

    it('should evaluate >>', () => {
      assert.equal(e.sync('9 >> 2'), 2);
      assert.equal(e.sync('-9 >> 2'), -3);
    });

    it('should evaluate >>>', () => {
      assert.equal(e.sync('9 >>> 2'), 2);
      assert.equal(e.sync('-9 >>> 2'), 1073741821);
    });
  });

  describe('binary bitwise operators', () => {
    it('should evaluate &', () => {
      assert.equal(e.sync('5 & 3'), 1);
      assert.equal(e.sync('7 & 9'), 1);
    });

    it('should evaluate |', () => {
      assert.equal(e.sync('5 | 2'), 7);
      assert.equal(e.sync('7 | 9'), 15);
    });

    it('should evaluate ^', () => {
      assert.equal(e.sync('5 ^ 2'), 7);
      assert.equal(e.sync('7 ^ 9'), 14);
    });
  });

  describe('binary logical operators', () => {
    it('should evaluate &&', () => {
      assert.equal(e.sync('0 && 1'), 0);
      assert.equal(e.sync('1 && 2'), 2);
      assert.equal(e.sync('true && false'), false);
      assert.equal(e.sync('a > 0 && b > 0', { a: 3, b: -2 }), false);
      assert.equal(e.sync('true  && true'), true);
      assert.equal(e.sync('true  && false'), false);
      assert.equal(e.sync('false && true'), false);
      assert.equal(e.sync('false && (3 == 4)'),   false);
      assert.equal(e.sync("'Cat' && 'Dog'"), 'Dog');
      assert.equal(e.sync("false && 'Cat'"), false);
      assert.equal(e.sync("'Cat' && false"), false);
      assert.equal(e.sync("''    && false"), '');
      assert.equal(e.sync("false && ''"), false);
    });

    it('should evaluate ||', () => {
      assert.equal(e.sync('true  || true'), true);
      assert.equal(e.sync('false || true'), true);
      assert.equal(e.sync('true  || false'), true);
      assert.equal(e.sync('false || (3 == 4)'), false);
      assert.equal(e.sync("'Cat' || 'Dog'"), 'Cat');
      assert.equal(e.sync("false || 'Cat'"), 'Cat');
      assert.equal(e.sync("'Cat' || false"), 'Cat');
      assert.equal(e.sync("''    || false"), false);
      assert.equal(e.sync("false || ''"), '');
      assert.equal(e.sync('false || val', { val: 'foo' }), 'foo');
    });

    it('should evaluate ??', () => {
      assert.equal(e.sync('null ?? "default string"'), 'default string');
      assert.equal(e.sync('undefined ?? "default string"'), 'default string');
      assert.equal(e.sync('0 ?? "default string"'), 0);
      assert.equal(e.sync('"0" ?? "default string"'), '0');
      assert.equal(e.sync('"" ?? "default string"'), '');
      assert.equal(e.sync('false ?? "default string"'), false);
    });
  });

  describe('"boolean binary" logical operators', () => {
    const b = (input, context, options) => e.sync(input, context, { booleanLogicalOperators: true, ...options });

    it('should evaluate &&', () => {
      assert.equal(b('0 && 1'), false);
      assert.equal(b('1 && 2'), true);
      assert.equal(b('true && false'), false);
      assert.equal(b('a > 0 && b > 0', { a: 3, b: -2 }), false);
      assert.equal(b('true  && true'), true);
      assert.equal(b('true  && false'), false);
      assert.equal(b('false && true'), false);
      assert.equal(b('false && (3 == 4)'),   false);
      assert.equal(b("'Cat' && 'Dog'"), true);
      assert.equal(b("false && 'Cat'"), false);
      assert.equal(b("'Cat' && false"), false);
      assert.equal(b("''    && false"), false);
      assert.equal(b("false && ''"), false);
    });

    it('should evaluate ||', () => {
      assert.equal(b('true  || true'), true);
      assert.equal(b('false || true'), true);
      assert.equal(b('true  || false'), true);
      assert.equal(b('false || (3 == 4)'), false);
      assert.equal(b("'Cat' || 'Dog'"), true);
      assert.equal(b("false || 'Cat'"), true);
      assert.equal(b("'Cat' || false"), true);
      assert.equal(b("''    || false"), false);
      assert.equal(b("false || ''"), false);
      assert.equal(b('false || val', { val: 'foo' }), true);
    });

    it('should evaluate ??', () => {
      assert.equal(b('undefined ?? "default string"'), true);
      assert.equal(b('null ?? "default string"'), true);
      assert.equal(b('undefined ?? "default string"'), true);
      assert.equal(b('false ?? "default string"'), false);
      assert.equal(b('undefined ?? null'), false);
      assert.equal(b('undefined ?? undefined'), false);
      assert.equal(b('0 ?? "default string"'), false);
      assert.equal(b('"0" ?? "default string"'), true);
      assert.equal(b('"" ?? "default string"'), false);
      assert.equal(b('false ?? "default string"'), false);
    });
  });

  describe('conditional (ternary) operator', () => {
    it('should evaluate ternary operators', () => {
      assert.equal(e.sync('val ? 1 : 0', { val: true }), 1);
      assert.equal(e.sync('val ? (a === b ? "one" : "two") : 0', { val: true, a: 1, b: 2 }), 'two');
      assert.equal(e.sync('val ? (a === b ? "one" : "two") : 0', { val: true, a: 2, b: 2 }), 'one');
    });
  });

  describe('optional chaining operators', () => {
    it('should evaluate optional chaining operator', () => {
      assert.equal(e.sync('a?.b'), undefined);
      assert.equal(e.sync('a?.b?.c'), undefined);
      assert.equal(e.sync('a?.b?.c?.d'), undefined);
    });
  });

  describe('assignment operators', () => {
    it('should evaluate =', () => {
      assert.throws(() => e.sync('a = b'));
    });

    it('should evaluate *=', () => {
      assert.throws(() => e.sync('a *= b'));
    });

    it('should evaluate **=', () => {
      assert.throws(() => e.sync('a **= b'));
    });

    it('should evaluate /=', () => {
      assert.throws(() => e.sync('a /= b'));
    });

    it('should evaluate %=', () => {
      assert.throws(() => e.sync('a %= b'));
    });

    it('should evaluate +=', () => {
      assert.throws(() => e.sync('a += b'));
    });

    it('should evaluate -=', () => {
      assert.throws(() => e.sync('a -= b'));
    });

    it('should evaluate <<=', () => {
      assert.throws(() => e.sync('a <<= b'));
    });

    it('should evaluate >>=', () => {
      assert.throws(() => e.sync('a >>= b'));
    });

    it('should evaluate >>>=', () => {
      assert.throws(() => e.sync('a >>>= b'));
    });

    it('should evaluate &=', () => {
      assert.throws(() => e.sync('a &= b'));
    });

    it('should evaluate ^=', () => {
      assert.throws(() => e.sync('a ^= b'));
    });

    it('should evaluate |=', () => {
      assert.throws(() => e.sync('a |= b'));
    });

    it('should evaluate &&=', () => {
      assert.throws(() => e.sync('a &&= b'));
    });

    it('should evaluate ||=', () => {
      assert.throws(() => e.sync('a ||= b'));
    });

    it('should evaluate ??=', () => {
      assert.throws(() => e.sync('a ??= b'));
    });
  });

  describe('comma operator (sequence expressions)', () => {
    it('should evaluate comma operator', () => {
      assert.equal(e.sync('(1, 2, 3)'), 3);
      assert.equal(e.sync('(a, b, c)', { a: 1, b: 2, c: 10 }), 10);
      assert.equal(e.sync('(a++, b, a)', { a: 1, b: 2, c: 10 }), 2);
      assert.equal(e.sync('((x++, x++, x))', { x: 1 }), 3);
    });
  });
});
