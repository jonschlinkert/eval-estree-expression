'use strict';

const assert = require('assert').strict;
const expression = require('../..');
const { evaluate: e } = expression;

describe('operators', () => {
  it('should evaluate grouping operators', async () => {
    assert.equal(await e('2 / 1 * 4 / 2'), 4);
    assert.equal(await e('2 / (1 * 4) / 2'), 0.25);
    assert.equal(await e('(2 / 1) + (4 / 2)'), 4);
    assert.equal(await e('2 / (1 + 4) / 2'), 0.2);
  });

  describe('increment and decrement operators', () => {
    it('should evaluate increment prefix operator', async () => {
      assert.equal(await e('++a', { a: Promise.resolve(1) }), 2);
      assert.equal(await e('++a', { a: Promise.resolve(-1) }), 0);
    });

    it('should evaluate increment postfix operator', async () => {
      assert.equal(await e('a++', { a: Promise.resolve(1) }), 2);
      assert.equal(await e('a++', { a: Promise.resolve(-1) }), 0);
    });

    it('should evaluate decrement prefix operator', async () => {
      assert.equal(await e('--a', { a: Promise.resolve(1) }), 0);
      assert.equal(await e('--a', { a: Promise.resolve(0) }), -1);
    });

    it('should evaluate decrement postfix operator', async () => {
      assert.equal(await e('a--', { a: Promise.resolve(1) }), 0);
      assert.equal(await e('a--', { a: Promise.resolve(0) }), -1);
    });
  });

  describe('unary operators', () => {
    it('should evaluate delete', async () => {
      const context = { obj: Promise.resolve({ a: 1, b: 2 }) };
      await e('delete obj.b', context);
      assert.deepEqual(context, { obj: { a: 1 } });
    });

    it('should evaluate void', async () => {
      assert.equal(await e('void 42'), undefined);
    });

    it('should evaluate typeof', async () => {
      assert.equal(await e('typeof 42'), 'number');
      assert.equal(await e('typeof "42"'), 'string');
    });

    it('should evaluate +', async () => {
      assert.equal(await e('+"42"'), 42);
      assert.equal(await e('+"string"'), NaN);
    });

    it('should evaluate -', async () => {
      assert.equal(await e('-"42"'), -42);
      assert.equal(await e('-42'), -42);
    });

    it('should evaluate ~', async () => {
      assert.equal(await e('~a', { a: Promise.resolve(5) }), -6);
      assert.equal(await e('~a', { a: Promise.resolve(-3) }), 2);
    });

    it('should evaluate !', async () => {
      assert.equal(await e('!a', { a: Promise.resolve(-3) }), false);
      assert.equal(await e('!a', { a: Promise.resolve(-3) }), false);
      assert.equal(await e('!a', { a: Promise.resolve(0) }), true);
      assert.equal(await e('!a', { a: Promise.resolve(false) }), true);

      assert.equal(await e('!!a', { a: Promise.resolve(-3) }), true);
      assert.equal(await e('!!a', { a: Promise.resolve(-3) }), true);
      assert.equal(await e('!!a', { a: Promise.resolve(0) }), false);
      assert.equal(await e('!!a', { a: Promise.resolve(false) }), false);
    });
  });

  describe('arithmetic operators', () => {
    it('should evaluate +', async () => {
      assert.equal(await e('1 + 1'), 2);
      assert.equal(await e('1 + a', { a: Promise.resolve(1) }), 2);
      assert.equal(await e('a + b', { a: Promise.resolve(1), b: Promise.resolve(9) }), 10);
    });

    it('should evaluate -', async () => {
      assert.equal(await e('1 - 1'), 0);
      assert.equal(await e('1 - 2'), -1);
      assert.equal(await e('1 - a', { a: 2 }), -1);
    });

    it('should evaluate /', async () => {
      assert.equal(await e('5 / 2'), 2.5);
      assert.equal(await e('1 / 2'), 0.5);
    });

    it('should evaluate *', async () => {
      assert.equal(await e('a * 2', { a: 3.1 }), 6.2);
      assert.equal(await e('a * b', { a: 3.1, b: 3 }), 9.3);
    });

    it('should evaluate %', async () => {
      assert.equal(await e('12 % 5'), 2);
      assert.equal(await e('-12 % 5'), -2);
    });

    it('should evaluate **', async () => {
      assert.equal(await e('3 ** 4'), 81);
      assert.equal(await e('10 ** -2'), 0.01);
      assert.equal(await e('2 ** 3 ** 2'), 512);
      assert.equal(await e('(2 ** 3) ** 2'), 64);
    });
  });

  describe('relational operators', () => {
    it('should evaluate in', async () => {
      assert.equal(await e('"a" in ["a", "b"]'), false);
      assert.equal(await e('"a" in { a: "b" }'), true);
      assert.equal(await e('"a" in obj', { obj: Promise.resolve({ a: 'b' }) }), true);
    });

    it('should evaluate instanceof', async () => {
      class Foo {}
      class Bar {}
      const a = new Foo();
      assert.equal(await e('a instanceof Foo', { Foo, a }), true);
      assert.equal(await e('a instanceof Bar', { Bar, Foo, a }), false);
    });

    it('should evaluate <', async () => {
      assert.equal(await e('1 < 1'), false);
      assert.equal(await e('1 < 2'), true);
      assert.equal(await e('1 < 0'), false);
    });

    it('should evaluate >', async () => {
      assert.equal(await e('1 > 1'), false);
      assert.equal(await e('1 > 2'), false);
      assert.equal(await e('1 > 0'), true);
    });

    it('should evaluate <=', async () => {
      assert.equal(await e('1 <= 1'), true);
      assert.equal(await e('1 <= 2'), true);
      assert.equal(await e('1 <= 0'), false);
    });

    it('should evaluate >=', async () => {
      assert.equal(await e('1 >= 1'), true);
      assert.equal(await e('1 >= 2'), false);
      assert.equal(await e('1 >= 0'), true);
    });
  });

  describe('equality operators', () => {
    it('should evaluate !==', async () => {
      assert.equal(await e('v !== undefined', { v: null }), true);
      assert.equal(await e('v !== undefined', { v: undefined }), false);
      assert.equal(await e('v !== undefined'), false);
      assert.equal(await e('5 !== 2'), true);
      assert.equal(await e('7 !== 7'), false);
      assert.equal(await e('1 !== 2'), true);
      assert.equal(await e('1 !== 1'), false);
      assert.equal(await e('a !== b', { a: 1, b: 2 }), true);
      assert.equal(await e('a !== b', { a: 2, b: 2 }), false);
      assert.equal(await e('"one" !== "two"'), true);
    });

    it('should evaluate ===', async () => {
      assert.equal(await e('"" === ""'), true);
      assert.equal(await e('"one" === "two"'), false);
      assert.equal(await e('v === undefined', { v: null }), false);
      assert.equal(await e('v === undefined', { v: undefined }), true);
      assert.equal(await e('v === undefined', { v: 1, undefined: 1 }), false);
      assert.equal(await e('v === undefined'), true);

      assert.equal(await e('a.b === undefined', { a: { b: null } }), false);
      assert.equal(await e('a.b === undefined', { a: { b: undefined } }), true);
      assert.equal(await e('a.b === undefined', { a: { b: 1, undefined: 1 } }), false);
      assert.equal(await e('a.b === undefined', { a: {} }), true);

      assert.equal(await e('undefined === null'), false);
      assert.equal(await e('5 === 2'), false);
      assert.equal(await e('1 === 2'), false);
      assert.equal(await e('1 === 1'), true);
      assert.equal(await e('7 === 7'), true);
      assert.equal(await e('a === b', { a: 1, b: 2 }), false);
      assert.equal(await e('a === b', { a: 2, b: 2 }), true);
    });

    it('should evaluate !=', async () => {
      assert.equal(await e('5 != 2'), true);
      assert.equal(await e('7 != "7"'), false);
      assert.equal(await e('1 != 2'), true);
      assert.equal(await e('1 != 1'), false);
      assert.equal(await e('a != b', { a: 1, b: '2' }), true);
      assert.equal(await e('a != b', { a: 2, b: '2' }), false);
      assert.equal(await e('"one" != "two"'), true);
    });

    it('should evaluate ==', async () => {
      assert.equal(await e('undefined == null'), true);
      assert.equal(await e('"1" == 1'), true);
      assert.equal(await e('5 == 2'), false);
      assert.equal(await e('7 == "7"'), true);
      assert.equal(await e('1 == 2'), false);
      assert.equal(await e('1 == 1'), true);
      assert.equal(await e('a == b', { a: Promise.resolve(1), b: '2' }), false);
      assert.equal(await e('a == b', { a: Promise.resolve(2), b: '2' }), true);
      assert.equal(await e('"one" == "two"'), false);
      assert.equal(await e('"" == ""'), true);
    });
  });

  describe('bitwise shift operators', () => {
    it('should evaluate <<', async () => {
      assert.equal(await e('9 << 3'), 72);
    });

    it('should evaluate >>', async () => {
      assert.equal(await e('9 >> 2'), 2);
      assert.equal(await e('-9 >> 2'), -3);
    });

    it('should evaluate >>>', async () => {
      assert.equal(await e('9 >>> 2'), 2);
      assert.equal(await e('-9 >>> 2'), 1073741821);
    });
  });

  describe('binary bitwise operators', () => {
    it('should evaluate &', async () => {
      assert.equal(await e('5 & 3'), 1);
      assert.equal(await e('7 & 9'), 1);
    });

    it('should evaluate |', async () => {
      assert.equal(await e('5 | 2'), 7);
      assert.equal(await e('7 | 9'), 15);
    });

    it('should evaluate ^', async () => {
      assert.equal(await e('5 ^ 2'), 7);
      assert.equal(await e('7 ^ 9'), 14);
    });
  });

  describe('binary logical operators', () => {
    it('should evaluate &&', async () => {
      assert.equal(await e('0 && 1'), 0);
      assert.equal(await e('1 && 2'), 2);
      assert.equal(await e('true && false'), false);
      assert.equal(await e('a > 0 && b > 0', { a: 3, b: -2 }), false);
      assert.equal(await e('true  && true'), true);
      assert.equal(await e('true  && false'), false);
      assert.equal(await e('false && true'), false);
      assert.equal(await e('false && (3 == 4)'),   false);
      assert.equal(await e("'Cat' && 'Dog'"), 'Dog');
      assert.equal(await e("false && 'Cat'"), false);
      assert.equal(await e("'Cat' && false"), false);
      assert.equal(await e("''    && false"), '');
      assert.equal(await e("false && ''"), false);
    });

    it('should evaluate ||', async () => {
      assert.equal(await e('true  || true'), true);
      assert.equal(await e('false || true'), true);
      assert.equal(await e('true  || false'), true);
      assert.equal(await e('false || (3 == 4)'), false);
      assert.equal(await e("'Cat' || 'Dog'"), 'Cat');
      assert.equal(await e("false || 'Cat'"), 'Cat');
      assert.equal(await e("'Cat' || false"), 'Cat');
      assert.equal(await e("''    || false"), false);
      assert.equal(await e("false || ''"), '');
      assert.equal(await e('false || val', { val: 'foo' }), 'foo');
    });

    it('should evaluate ??', async () => {
      assert.equal(await e('null ?? "default string"'), 'default string');
      assert.equal(await e('undefined ?? "default string"'), 'default string');
      assert.equal(await e('0 ?? "default string"'), 0);
      assert.equal(await e('"0" ?? "default string"'), '0');
      assert.equal(await e('"" ?? "default string"'), '');
      assert.equal(await e('false ?? "default string"'), false);
    });
  });

  describe('conditional (ternary) operator', () => {
    it('should evaluate ternary operators', async () => {
      assert.equal(await e('val ? 1 : 0', { val: true }), 1);
      assert.equal(await e('val ? (a === b ? "one" : "two") : 0', { val: true, a: 1, b: 2 }), 'two');
      assert.equal(await e('val ? (a === b ? "one" : "two") : 0', { val: true, a: 2, b: 2 }), 'one');
    });
  });

  describe('optional chaining operators', () => {
    it('should evaluate optional chaining operator', async () => {
      assert.equal(await e('a?.b'), undefined);
      assert.equal(await e('a?.b?.c'), undefined);
      assert.equal(await e('a?.b?.c?.d'), undefined);
    });
  });

  describe('assignment operators', () => {
    it('should evaluate =', () => {
      return assert.rejects(() => e('a = b'));
    });

    it('should evaluate *=', () => {
      return assert.rejects(() => e('a *= b'));
    });

    it('should evaluate **=', () => {
      return assert.rejects(() => e('a **= b'));
    });

    it('should evaluate /=', () => {
      return assert.rejects(() => e('a /= b'));
    });

    it('should evaluate %=', () => {
      return assert.rejects(() => e('a %= b'));
    });

    it('should evaluate +=', () => {
      return assert.rejects(() => e('a += b'));
    });

    it('should evaluate -=', () => {
      return assert.rejects(() => e('a -= b'));
    });

    it('should evaluate <<=', () => {
      return assert.rejects(() => e('a <<= b'));
    });

    it('should evaluate >>=', () => {
      return assert.rejects(() => e('a >>= b'));
    });

    it('should evaluate >>>=', () => {
      return assert.rejects(() => e('a >>>= b'));
    });

    it('should evaluate &=', () => {
      return assert.rejects(() => e('a &= b'));
    });

    it('should evaluate ^=', () => {
      return assert.rejects(() => e('a ^= b'));
    });

    it('should evaluate |=', () => {
      return assert.rejects(() => e('a |= b'));
    });

    it('should evaluate &&=', () => {
      return assert.rejects(() => e('a &&= b'));
    });

    it('should evaluate ||=', () => {
      return assert.rejects(() => e('a ||= b'));
    });

    it('should evaluate ??=', () => {
      return assert.rejects(() => e('a ??= b'));
    });
  });

  describe('comma operator', () => {
    it('should evaluate comma operator', async () => {
      assert.equal(await e('(1, 2, 3)'), 3);
      assert.equal(await e('(a, b, c)', { a: 1, b: 2, c: 10 }), 10);
      assert.equal(await e('((x++, x++, x))', { x: 1 }), 3);
    });
  });
});
