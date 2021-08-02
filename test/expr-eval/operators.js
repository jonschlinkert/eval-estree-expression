'use strict';

const assert = require('assert/strict');
const spy = require('./support/spy');
const { evaluate: e } = require('../support');
const opts = { allow_functions: true };

function returnTrue() {
  return true;
}

function returnFalse() {
  return false;
}

function assertCloseTo(expected, actual, delta) {
  return assert.ok(Math.abs(expected - actual) <= delta);
}

describe('Operators', () => {
  describe('== operator', () => {
    it('2 == 3', () => {
      assert.equal(e.sync('2 == 3'), false);
    });

    it('3 * 1 == 2', () => {
      assert.equal(e.sync('3 == 2'), false);
    });

    it('3 == 3', () => {
      assert.equal(e.sync('3 == 3'), true);
    });

    it('"3" == 3', () => {
      assert.equal(e.sync('"3" == 3'), true);
    });

    it('"string 1" == "string 2"', () => {
      assert.equal(e.sync('"string 1" == "string 2"'), false);
    });

    it('"string 1" == "string 1"', () => {
      assert.equal(e.sync('"string 1" == "string 1"'), true);
    });

    it('"3" == "3"', () => {
      assert.equal(e.sync('"3" == "3"'), true);
    });
  });

  describe('!= operator', () => {
    it('2 != 3', () => {
      assert.equal(e.sync('2 != 3'), true);
    });

    it('3 != 2', () => {
      assert.equal(e.sync('3 != 2'), true);
    });

    it('3 != 3', () => {
      assert.equal(e.sync('3 != 3'), false);
    });

    it('"3" != 3', () => {
      assert.equal(e.sync('"3" != 3'), false);
    });

    it('"3" != "3"', () => {
      assert.equal(e.sync('"3" != "3"'), false);
    });

    it('"string 1" != "string 1"', () => {
      assert.equal(e.sync('"string 1" != "string 1"'), false);
    });

    it('"string 1" != "string 2"', () => {
      assert.equal(e.sync('"string 1" != "string 2"'), true);
    });
  });

  describe('> operator', () => {
    it('2 > 3', () => {
      assert.equal(e.sync('2 > 3'), false);
    });

    it('3 > 2', () => {
      assert.equal(e.sync('3 > 2'), true);
    });

    it('3 > 3', () => {
      assert.equal(e.sync('3 > 3'), false);
    });
  });

  describe('>= operator', () => {
    it('2 >= 3', () => {
      assert.equal(e.sync('2 >= 3'), false);
    });

    it('3 >= 2', () => {
      assert.equal(e.sync('3 >= 2'), true);
    });

    it('3 >= 3', () => {
      assert.equal(e.sync('3 >= 3'), true);
    });
  });

  describe('< operator', () => {
    it('2 < 3', () => {
      assert.equal(e.sync('2 < 3'), true);
    });

    it('3 < 2', () => {
      assert.equal(e.sync('3 < 2'), false);
    });

    it('3 < 3', () => {
      assert.equal(e.sync('3 < 3'), false);
    });
  });

  describe('<= operator', () => {
    it('2 <= 3', () => {
      assert.equal(e.sync('2 <= 3'), true);
    });

    it('3 <= 2', () => {
      assert.equal(e.sync('3 <= 2'), false);
    });

    it('3 <= 3', () => {
      assert.equal(e.sync('3 <= 3'), true);
    });
  });

  describe('and operator', () => {
    it('1 and 0', () => {
      assert.equal(e.sync('1 and 0', {}, { boolean_logical_operators: true }), false);
    });

    it('1 and 1', () => {
      assert.equal(e.sync('1 and 1', {}, { boolean_logical_operators: true }), true);
    });

    it('0 and 0', () => {
      assert.equal(e.sync('0 and 0', {}, { boolean_logical_operators: true }), false);
    });

    it('0 and 1', () => {
      assert.equal(e.sync('0 and 1', {}, { boolean_logical_operators: true }), false);
    });

    it('0 and 1 and 0', () => {
      assert.equal(e.sync('0 and 1 and 0', {}, { boolean_logical_operators: true }), false);
    });

    it('1 and 1 and 0', () => {
      assert.equal(e.sync('1 and 1 and 0', {}, { boolean_logical_operators: true }), false);
    });

    it('skips rhs when lhs is false', () => {
      const notCalled = spy(returnFalse);
      assert.equal(e.sync('false and notCalled()', { notCalled }, { allow_functions: true, boolean_logical_operators: true }), false);
      assert.equal(notCalled.called, false);
    });

    it('evaluates rhs when lhs is true', () => {
      const called = spy(returnFalse);
      assert.equal(e.sync('true and called()', { called }, { allow_functions: true, boolean_logical_operators: true }), false);
      assert.equal(called.called, true);
    });
  });

  describe('or operator', () => {
    it('1 or 0', () => {
      assert.equal(e.sync('1 or 0', {}, { boolean_logical_operators: true }), true);
    });

    it('1 or 1', () => {
      assert.equal(e.sync('1 or 1', {}, { boolean_logical_operators: true }), true);
    });

    it('0 or 0', () => {
      assert.equal(e.sync('0 or 0', {}, { boolean_logical_operators: true }), false);
    });

    it('0 or 1', () => {
      assert.equal(e.sync('0 or 1', {}, { boolean_logical_operators: true }), true);
    });

    it('0 or 1 or 0', () => {
      assert.equal(e.sync('0 or 1 or 0', {}, { boolean_logical_operators: true }), true);
    });

    it('1 or 1 or 0', () => {
      assert.equal(e.sync('1 or 1 or 0', {}, { boolean_logical_operators: true }), true);
    });

    it('skips rhs when lhs is true', () => {
      const notCalled = spy(returnFalse);

      assert.equal(e.sync('true or notCalled()', { notCalled }, { allow_functions: true, boolean_logical_operators: true }), true);
      assert.equal(notCalled.called, false);
    });

    it('evaluates rhs when lhs is false', () => {
      const called = spy(returnTrue);

      assert.equal(e.sync('false or called()', { called }, { allow_functions: true, boolean_logical_operators: true }), true);
      assert.equal(called.called, true);
    });
  });

  describe('in operator', () => {
    it('"a" in ["a", "b"]', () => {
      assert.equal(e.sync('"a" in toto', { 'toto': ['a', 'b'] }), true);
    });

    it('"a" in ["b", "a"]', () => {
      assert.equal(e.sync('"a" in toto', { 'toto': ['b', 'a'] }), true);
    });

    it('3 in [4, 3]', () => {
      assert.equal(e.sync('3 in toto', { 'toto': [4, 3] }), true);
    });

    it('"c" in ["a", "b"]', () => {
      assert.equal(e.sync('"c" in toto', { 'toto': ['a', 'b'] }), false);
    });

    it('"c" in ["b", "a"]', () => {
      assert.equal(e.sync('"c" in toto', { 'toto': ['b', 'a'] }), false);
    });

    it('3 in [1, 2]', () => {
      assert.equal(e.sync('3 in toto', { 'toto': [1, 2] }), false);
    });
  });

  describe('not operator', () => {
    it('not 1', () => {
      assert.equal(e.sync('not 1', {}, { not_expression: true }), false);
    });

    it('not true', () => {
      assert.equal(e.sync('not true', {}, { not_expression: true }), false);
    });

    it('not 0', () => {
      assert.equal(e.sync('not 0', {}, { not_expression: true }), true);
    });

    it('not false', () => {
      assert.equal(e.sync('not false', {}, { not_expression: true }), true);
    });

    it('not 4', () => {
      assert.equal(e.sync('not 4', {}, { not_expression: true }), false);
    });

    it('1 and not 0', () => {
      assert.equal(e.sync('1 and not 0', {}, { not_expression: true }), true);
    });

    it('not "0"', () => {
      assert.equal(e.sync('not "0"', {}, { not_expression: true }), false);
    });

    it('not "', () => {
      assert.equal(e.sync('not ""', {}, { not_expression: true }), true);
    });
  });

  describe('conditional operator', () => {
    it('1 ? 2 : 0 ? 3 : 4', () => {
      assert.equal(e.sync('1 ? 2 : 0 ? 3 : 4'), 2);
    });

    it('(1 ? 2 : 0) ? 3 : 4', () => {
      assert.equal(e.sync('(1 ? 2 : 0) ? 3 : 4'), 3);
    });

    it('0 ? 2 : 0 ? 3 : 4', () => {
      assert.equal(e.sync('0 ? 2 : 0 ? 3 : 4'), 4);
    });

    it('(0 ? 2 : 0) ? 3 : 4', () => {
      assert.equal(e.sync('0 ? 2 : 0 ? 3 : 4'), 4);
    });

    it('(0 ? 0 : 2) ? 3 : 4', () => {
      assert.equal(e.sync('(1 ? 2 : 0) ? 3 : 4'), 3);
    });

    // it('Math.min(1 ? 3 : 10, 0 ? 11 : 2)', () => {
    //   assert.equal(e.sync('Math.min(1 ? 3 : 10, 0 ? 11 : 2)', {}, opts), 2);
    // });

    it('a == 1 ? b == 2 ? 3 : 4 : 5', () => {
      assert.equal(e.sync('a == 1 ? b == 2 ? 3 : 4 : 5', { a: 1, b: 2 }), 3);
      assert.equal(e.sync('a == 1 ? b == 2 ? 3 : 4 : 5', { a: 1, b: 9 }), 4);
      assert.equal(e.sync('a == 1 ? b == 2 ? 3 : 4 : 5', { a: 9, b: 2 }), 5);
      assert.equal(e.sync('a == 1 ? b == 2 ? 3 : 4 : 5', { a: 9, b: 9 }), 5);
    });

    it('should only evaluate one branch', () => {
      assert.equal(e.sync('1 ? 42 : fail'), 42);
      assert.equal(e.sync('0 ? fail : 99'), 99);
    });
  });

  describe('length operator', () => {
    it('should return 0 for empty strings', () => {
      assert.equal(e.sync('"".length'), 0);
    });

    it('should return the length of a string', () => {
      assert.equal(e.sync('"a".length'), 1);
      assert.equal(e.sync('"as".length'), 2);
      assert.equal(e.sync('"asd".length'), 3);
      assert.equal(e.sync('"asdf".length'), 4);
    });

    it('should return 0 for empty arrays', () => {
      assert.equal(e.sync('[].length'), 0);
    });

    it('should return the length of an array', () => {
      assert.equal(e.sync('[123].length'), 1);
      assert.equal(e.sync('[123, 456].length'), 2);
      assert.equal(e.sync('[12, 34, 56].length'), 3);
      assert.equal(e.sync('[1, 2, 3, 4].length'), 4);
    });
  });

  describe('% operator', () => {
    it('returns the correct value', () => {
      assert.equal(e.sync('0 % 5'), 0);
      assert.equal(e.sync('1 % 5'), 1);
      assert.equal(e.sync('2 % 5'), 2);
      assert.equal(e.sync('3 % 5'), 3);
      assert.equal(e.sync('4 % 5'), 4);
      assert.equal(e.sync('5 % 5'), 0);
      assert.equal(e.sync('6 % 5'), 1);
      assert.equal(e.sync('-2 % 5'), -2);
      assert.equal(e.sync('-6 % 5'), -1);
    });

    it('returns NaN for 0 divisor', () => {
      assert.ok(isNaN(e.sync('0 % 0')));
      assert.ok(isNaN(e.sync('1 % 0')));
      assert.ok(isNaN(e.sync('-1 % 0')));
    });
  });

  describe('Math.sin(x)', () => {
    // it('returns the correct value', () => {
    //   const delta = 1e-15;
    //   assert.equal(e.sync('Math.sin(0)', {}, opts), 0);
    //   assertCloseTo(e.sync('Math.sin(0.5)', {}, opts), 0.479425538604203, delta);
    //   assertCloseTo(e.sync('Math.sin(1)', {}, opts), 0.8414709848078965, delta);
    //   assertCloseTo(e.sync('Math.sin(-1)', {}, opts), -0.8414709848078965, delta);
    //   assertCloseTo(e.sync('Math.sin(Math.PI/4)', {}, opts), 0.7071067811865475, delta);
    //   assertCloseTo(e.sync('Math.sin(Math.PI/2)', {}, opts), 1, delta);
    //   assertCloseTo(e.sync('Math.sin(3*Math.PI/4)', {}, opts), 0.7071067811865475, delta);
    //   assertCloseTo(e.sync('Math.sin (Math.PI)', {}, opts), 0, delta);
    //   assertCloseTo(e.sync('Math.sin(2*Math.PI)', {}, opts), 0, delta);
    //   assertCloseTo(e.sync('Math.sin(-Math.PI)', {}, opts), 0, delta);
    //   assertCloseTo(e.sync('Math.sin(3*Math.PI/2)', {}, opts), -1, delta);
    //   assertCloseTo(e.sync('Math.sin (15)', {}, opts), 0.6502878401571168, delta);
    // });

    // it('returns the correct value -async', async () => {
    //   const delta = 1e-15;
    //   assert.equal(await e('Math.sin(0)', {}, opts), 0);
    //   assertCloseTo(await e('Math.sin(0.5)', {}, opts), 0.479425538604203, delta);
    //   assertCloseTo(await e('Math.sin(1)', {}, opts), 0.8414709848078965, delta);
    //   assertCloseTo(await e('Math.sin(-1)', {}, opts), -0.8414709848078965, delta);
    //   assertCloseTo(await e('Math.sin(Math.PI/4)', {}, opts), 0.7071067811865475, delta);
    //   assertCloseTo(await e('Math.sin(Math.PI/2)', {}, opts), 1, delta);
    //   assertCloseTo(await e('Math.sin(3*Math.PI/4)', {}, opts), 0.7071067811865475, delta);
    //   assertCloseTo(await e('Math.sin (Math.PI)', {}, opts), 0, delta);
    //   assertCloseTo(await e('Math.sin(2*Math.PI)', {}, opts), 0, delta);
    //   assertCloseTo(await e('Math.sin(-Math.PI)', {}, opts), 0, delta);
    //   assertCloseTo(await e('Math.sin(3*Math.PI/2)', {}, opts), -1, delta);
    //   assertCloseTo(await e('Math.sin (15)', {}, opts), 0.6502878401571168, delta);
    // });
  });

  // describe('cos(x)', () => {
  //   it('returns the correct value', () => {
  //     const delta = 1e-15;
  //     assert.equal(e.sync('Math.cos (0)', {}, opts), 1);
  //     assertCloseTo(e.sync('Math.cos (0.5)', {}, opts), 0.8775825618903728, delta);
  //     assertCloseTo(e.sync('Math.cos (1)', {}, opts), 0.5403023058681398, delta);
  //     assertCloseTo(e.sync('Math.cos (-1)', {}, opts), 0.5403023058681398, delta);
  //     assertCloseTo(e.sync('Math.cos(Math.PI/4)', {}, opts), 0.7071067811865475, delta);
  //     assertCloseTo(e.sync('Math.cos(Math.PI/2)', {}, opts), 0, delta);
  //     assertCloseTo(e.sync('Math.cos(3*Math.PI/4)', {}, opts), -0.7071067811865475, delta);
  //     assertCloseTo(e.sync('Math.cos (Math.PI)', {}, opts), -1, delta);
  //     assertCloseTo(e.sync('Math.cos(2*Math.PI)', {}, opts), 1, delta);
  //     assertCloseTo(e.sync('Math.cos (-Math.PI)', {}, opts), -1, delta);
  //     assertCloseTo(e.sync('Math.cos(3*Math.PI/2)', {}, opts), 0, delta);
  //     assertCloseTo(e.sync('Math.cos (15)', {}, opts), -0.7596879128588213, delta);
  //   });
  // });

  describe('-x', () => {
    it('negates its argument', () => {
      assert.equal(e.sync('-0'), -0);
      assert.equal(e.sync('-0.5'), -0.5);
      assert.equal(e.sync('-1'), -1);
      assert.equal(e.sync('-123'), -123);
      assert.equal(e.sync('-(-1)'), 1);
    });

    it('converts its argument to a number', () => {
      assert.equal(e.sync('-"123"'), -123);
    });
  });

  describe('+x', () => {
    it('returns its argument', () => {
      assert.equal(e.sync('+0'), 0);
      assert.equal(e.sync('+0.5'), 0.5);
      assert.equal(e.sync('+1'), 1);
      assert.equal(e.sync('+123'), 123);
      assert.equal(e.sync('+(+1)'), 1);
    });

    it('converts its argument to a number', () => {
      assert.equal(e.sync('+"123"'), 123);
    });
  });

  describe('[] operator', () => {
    it('a[0]', () => {
      assert.equal(e.sync('a[0]', { a: [ 4, 3, 2, 1 ] }), 4);
    });

    it('a[0.1]', () => {
      assert.equal(e.sync('a[0.1]', { a: [ 4, 3, 2, 1 ] }), undefined);
    });

    it('a[3]', () => {
      assert.equal(e.sync('a[3]', { a: [ 4, 3, 2, 1 ] }), 1);
    });

    it('a[3 - 2]', () => {
      assert.equal(e.sync('a[3 - 2]', { a: [ 4, 3, 2, 1 ] }), 3);
    });

    it('a["foo"]', () => {
      assert.equal(e.sync('a["foo"]', { a: { foo: 'bar' } }), 'bar');
    });

    it('a[2]^3', () => {
      assert.equal(e.sync('a[2]^3', { a: [ 1, 2, 3, 4 ] }), 0);
    });
  });
});
