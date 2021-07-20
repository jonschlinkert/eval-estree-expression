'use strict';

const assert = require('assert').strict;
const { evaluate: e } = require('../index');

describe('operators', () => {
  it('should evaluate grouping operators', () => {
    assert.equal(e('2 / 1 * 4 / 2'), 4);
    assert.equal(e('2 / (1 * 4) / 2'), 0.25);
    assert.equal(e('(2 / 1) + (4 / 2)'), 4);
    assert.equal(e('2 / (1 + 4) / 2'), 0.2);
  });

  describe('increment and decrement operators', () => {
    it('should evaluate increment prefix operator', () => {
      assert.equal(e('++a', { a: 1 }), 2);
      assert.equal(e('++a', { a: -1 }), 0);
    });

    it('should evaluate increment postfix operator', () => {
      assert.equal(e('a++', { a: 1 }), 2);
      assert.equal(e('a++', { a: -1 }), 0);
    });

    it('should evaluate decrement prefix operator', () => {
      assert.equal(e('--a', { a: 1 }), 0);
      assert.equal(e('--a', { a: 0 }), -1);
    });

    it('should evaluate decrement postfix operator', () => {
      assert.equal(e('a--', { a: 1 }), 0);
      assert.equal(e('a--', { a: 0 }), -1);
    });
  });

  describe('unary operators', () => {
    it('should evaluate delete', () => {
      const context = { obj: { a: 1, b: 2 } };
      e('delete obj.b', context);
      assert.deepEqual(context, { obj: { a: 1 } });
    });

    it('should evaluate void', () => {
      assert.equal(e('void 42'), undefined);
    });

    it('should evaluate typeof', () => {
      assert.equal(e('typeof 42'), 'number');
      assert.equal(e('typeof "42"'), 'string');
    });

    it('should evaluate +', () => {
      assert.equal(e('+"42"'), 42);
      assert.equal(e('+"string"'), NaN);
    });

    it('should evaluate -', () => {
      assert.equal(e('-"42"'), -42);
      assert.equal(e('-42'), -42);
    });

    it('should evaluate ~', () => {
      assert.equal(e('~a', { a: 5, b: -3 }), -6);
      assert.equal(e('~b', { a: 5, b: -3 }), 2);
    });

    it('should evaluate !', () => {
      assert.equal(e('!a', { a: 5, b: -3 }), false);
      assert.equal(e('!b', { a: 5, b: -3 }), false);
      assert.equal(e('!b', { a: 5, b: 0 }), true);
      assert.equal(e('!b', { a: 5, b: false }), true);

      assert.equal(e('!!a', { a: 5, b: -3 }), true);
      assert.equal(e('!!b', { a: 5, b: -3 }), true);
      assert.equal(e('!!b', { a: 5, b: 0 }), false);
      assert.equal(e('!!b', { a: 5, b: false }), false);
    });
  });

  describe('arithmetic operators', () => {
    it('should evaluate +', () => {
      assert.equal(e('1 + 1'), 2);
      assert.equal(e('1 + a', { a: 1 }), 2);
      assert.equal(e('a + b', { a: 1, b: 9 }), 10);
    });

    it('should evaluate -', () => {
      assert.equal(e('1 - 1'), 0);
      assert.equal(e('1 - 2'), -1);
      assert.equal(e('1 - a', { a: 2 }), -1);
    });

    it('should evaluate /', () => {
      assert.equal(e('5 / 2'), 2.5);
      assert.equal(e('1 / 2'), 0.5);
    });

    it('should evaluate *', () => {
      assert.equal(e('a * 2', { a: 3.1 }), 6.2);
      assert.equal(e('a * b', { a: 3.1, b: 3 }), 9.3);
    });

    it('should evaluate %', () => {
      assert.equal(e('12 % 5'), 2);
      assert.equal(e('-12 % 5'), -2);
    });

    it('should evaluate **', () => {
      assert.equal(e('3 ** 4'), 81);
      assert.equal(e('10 ** -2'), 0.01);
      assert.equal(e('2 ** 3 ** 2'), 512);
      assert.equal(e('(2 ** 3) ** 2'), 64);
    });
  });

  describe('relational operators', () => {
    it('should evaluate in', () => {
      assert.equal(e('"a" in ["a", "b"]'), false);
      assert.equal(e('"a" in { a: "b" }'), true);
      assert.equal(e('"a" in obj', { obj: { a: 'b' } }), true);
    });

    it('should evaluate instanceof', () => {
      class Foo {}
      class Bar {}
      const a = new Foo();
      assert.equal(e('a instanceof Foo', { Foo, a }), true);
      assert.equal(e('a instanceof Bar', { Bar, Foo, a }), false);
    });

    it('should evaluate <', () => {
      assert.equal(e('1 < 1'), false);
      assert.equal(e('1 < 2'), true);
      assert.equal(e('1 < 0'), false);
    });

    it('should evaluate >', () => {
      assert.equal(e('1 > 1'), false);
      assert.equal(e('1 > 2'), false);
      assert.equal(e('1 > 0'), true);
    });

    it('should evaluate <=', () => {
      assert.equal(e('1 <= 1'), true);
      assert.equal(e('1 <= 2'), true);
      assert.equal(e('1 <= 0'), false);
    });

    it('should evaluate >=', () => {
      assert.equal(e('1 >= 1'), true);
      assert.equal(e('1 >= 2'), false);
      assert.equal(e('1 >= 0'), true);
    });
  });

  describe('equality operators', () => {
    it('should evaluate !==', () => {
      assert.equal(e('v !== undefined', { v: null }), true);
      assert.equal(e('v !== undefined', { v: undefined }), false);
      assert.equal(e('v !== undefined'), false);
      assert.equal(e('5 !== 2'), true);
      assert.equal(e('7 !== 7'), false);
      assert.equal(e('a !== b', { a: 1, b: 2 }), true);
      assert.equal(e('a !== b', { a: 2, b: 2 }), false);
    });

    it('should evaluate ===', () => {
      assert.equal(e('v === undefined', { v: null }), false);
      assert.equal(e('v === undefined', { v: undefined }), true);
      assert.equal(e('v === undefined', { v: 1, undefined: 1 }), false);
      assert.equal(e('v === undefined'), true);

      assert.equal(e('a.b === undefined', { a: { b: null } }), false);
      assert.equal(e('a.b === undefined', { a: { b: undefined } }), true);
      assert.equal(e('a.b === undefined', { a: { b: 1, undefined: 1 } }), false);
      assert.equal(e('a.b === undefined', { a: {} }), true);

      assert.equal(e('undefined === null'), false);
      assert.equal(e('5 === 2'), false);
      assert.equal(e('7 === 7'), true);
      assert.equal(e('a === b', { a: 1, b: 2 }), false);
      assert.equal(e('a === b', { a: 2, b: 2 }), true);
    });

    it('should evaluate !=', () => {
      assert.equal(e('5 != 2'), true);
      assert.equal(e('7 != "7"'), false);
      assert.equal(e('a != b', { a: 1, b: '2' }), true);
      assert.equal(e('a != b', { a: 2, b: '2' }), false);
    });

    it('should evaluate ==', () => {
      assert.equal(e('undefined == null'), true);
      assert.equal(e('"1" == 1'), true);
      assert.equal(e('5 == 2'), false);
      assert.equal(e('7 == "7"'), true);
      assert.equal(e('a == b', { a: 1, b: '2' }), false);
      assert.equal(e('a == b', { a: 2, b: '2' }), true);
    });
  });

  describe('bitwise shift operators', () => {
    it('should evaluate <<', () => {
      assert.equal(e('9 << 3'), 72);
    });

    it('should evaluate >>', () => {
      assert.equal(e('9 >> 2'), 2);
      assert.equal(e('-9 >> 2'), -3);
    });

    it('should evaluate >>>', () => {
      assert.equal(e('9 >>> 2'), 2);
      assert.equal(e('-9 >>> 2'), 1073741821);
    });
  });

  describe('binary bitwise operators', () => {
    it('should evaluate &', () => {
      assert.equal(e('5 & 3'), 1);
      assert.equal(e('7 & 9'), 1);
    });

    it('should evaluate |', () => {
      assert.equal(e('5 | 2'), 7);
      assert.equal(e('7 | 9'), 15);
    });

    it('should evaluate ^', () => {
      assert.equal(e('5 ^ 2'), 7);
      assert.equal(e('7 ^ 9'), 14);
    });
  });

  describe('binary logical operators', () => {
    it('should evaluate &&', () => {
      assert.equal(e('0 && 1'), 0);
      assert.equal(e('1 && 2'), 2);
      assert.equal(e('true && false'), false);
      assert.equal(e('a > 0 && b > 0', { a: 3, b: -2 }), false);
      assert.equal(e('true  && true'), true);
      assert.equal(e('true  && false'), false);
      assert.equal(e('false && true'), false);
      assert.equal(e('false && (3 == 4)'),   false);
      assert.equal(e("'Cat' && 'Dog'"), 'Dog');
      assert.equal(e("false && 'Cat'"), false);
      assert.equal(e("'Cat' && false"), false);
      assert.equal(e("''    && false"), '');
      assert.equal(e("false && ''"), false);
    });

    it('should evaluate ||', () => {
      assert.equal(e('true  || true'), true);
      assert.equal(e('false || true'), true);
      assert.equal(e('true  || false'), true);
      assert.equal(e('false || (3 == 4)'), false);
      assert.equal(e("'Cat' || 'Dog'"), 'Cat');
      assert.equal(e("false || 'Cat'"), 'Cat');
      assert.equal(e("'Cat' || false"), 'Cat');
      assert.equal(e("''    || false"), false);
      assert.equal(e("false || ''"), '');
      assert.equal(e('false || val', { val: 'foo' }), 'foo');
    });

    it('should evaluate ??', () => {
      assert.equal(e('null ?? "default string"'), 'default string');
      assert.equal(e('undefined ?? "default string"'), 'default string');
      assert.equal(e('0 ?? "default string"'), 0);
      assert.equal(e('"0" ?? "default string"'), '0');
      assert.equal(e('"" ?? "default string"'), '');
      assert.equal(e('false ?? "default string"'), false);
    });
  });

  describe('conditional (ternary) operator', () => {
    it('should evaluate ternary operators', () => {
      assert.equal(e('val ? 1 : 0', { val: true }), 1);
      assert.equal(e('val ? (a === b ? "one" : "two") : 0', { val: true, a: 1, b: 2 }), 'two');
      assert.equal(e('val ? (a === b ? "one" : "two") : 0', { val: true, a: 2, b: 2 }), 'one');
    });
  });

  describe('optional chaining operators', () => {
    it('should evaluate optional chaining operator', () => {
      assert.equal(e('a?.b'), undefined);
      assert.equal(e('a?.b?.c'), undefined);
      assert.equal(e('a?.b?.c?.d'), undefined);
    });
  });

  describe('assignment operators', () => {
    it('should evaluate =', () => {
      assert.throws(() => e('a = b'), /Assignment expression/);
    });

    it('should evaluate *=', () => {
      assert.throws(() => e('a *= b'), /Assignment expression/);
    });

    it('should evaluate **=', () => {
      assert.throws(() => e('a **= b'), /Assignment expression/);
    });

    it('should evaluate /=', () => {
      assert.throws(() => e('a /= b'), /Assignment expression/);
    });

    it('should evaluate %=', () => {
      assert.throws(() => e('a %= b'), /Assignment expression/);
    });

    it('should evaluate +=', () => {
      assert.throws(() => e('a += b'), /Assignment expression/);
    });

    it('should evaluate -=', () => {
      assert.throws(() => e('a -= b'), /Assignment expression/);
    });

    it('should evaluate <<=', () => {
      assert.throws(() => e('a <<= b'), /Assignment expression/);
    });

    it('should evaluate >>=', () => {
      assert.throws(() => e('a >>= b'), /Assignment expression/);
    });

    it('should evaluate >>>=', () => {
      assert.throws(() => e('a >>>= b'), /Assignment expression/);
    });

    it('should evaluate &=', () => {
      assert.throws(() => e('a &= b'), /Assignment expression/);
    });

    it('should evaluate ^=', () => {
      assert.throws(() => e('a ^= b'), /Assignment expression/);
    });

    it('should evaluate |=', () => {
      assert.throws(() => e('a |= b'), /Assignment expression/);
    });

    it('should evaluate &&=', () => {
      assert.throws(() => e('a &&= b'), /Assignment expression/);
    });

    it('should evaluate ||=', () => {
      assert.throws(() => e('a ||= b'), /Assignment expression/);
    });

    it('should evaluate ??=', () => {
      assert.throws(() => e('a ??= b'), /Assignment expression/);
    });
  });

  describe('comma operator', () => {
    it('should evaluate comma operator', () => {
      assert.equal(e('(1, 2, 3)'), 3);
      assert.equal(e('(a, b, c)', { a: 1, b: 2, c: 10 }), 10);
      assert.equal(e('((x++, x++, x))', { x: 1 }), 3);
    });
  });
});
