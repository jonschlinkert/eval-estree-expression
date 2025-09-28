'use strict';

const assert = require('node:assert/strict');
const Context = require('../support/Context');
const { default: getValue } = require('get-value');
const { evaluate } = require('../support');
const { generate } = require('escodegen');

const opts = {
  functions: true,
  generate,
  generator: 'escodegen',
  strict: false,
  allowAwaitOutsideFunction: true,
  prefix: '__data'
};

const e = (input, context, options) => {
  if (/^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*)*$/.test(input)) {
    const value = getValue(context, input);
    if (value !== undefined) {
      return value;
    }
  }

  return evaluate.sync(input, context, { ...opts, ...options });
};

describe('prefix support', () => {
  describe('basic prefix functionality', () => {
    it('should prefix simple identifiers', () => {
      const data = { __data: { a: 1, b: 2 } };
      assert.equal(e('a', data), 1);
      assert.equal(e('b', data), 2);
    });

    it('should prefix identifiers in expressions', () => {
      const data = { __data: { x: 5, y: 3 } };
      assert.equal(e('x + y', data), 8);
      assert.equal(e('x * y', data), 15);
      assert.equal(e('x - y', data), 2);
    });

    it('should prefix nested property access', () => {
      const data = { __data: { obj: { prop: 'value' } } };
      assert.equal(e('obj.prop', data), 'value');
    });

    it('should not double-prefix already prefixed identifiers', () => {
      const data = { __data: { a: 1 }, '__data.b': 2 };
      assert.equal(e('__data.a', data), 1);
      assert.equal(e('__data.b', data), 2);
    });

    it('should handle undefined variables with prefix', () => {
      const data = { __data: {} };
      assert.equal(e('nonexistent', data), undefined);
    });

    it('should work with custom prefix', () => {
      const customOpts = { ...opts, prefix: 'ctx' };
      const data = { ctx: { value: 42 } };
      assert.equal(e('value', data, customOpts), 42);
    });
  });

  describe('prefix with Context class', () => {
    it('should work with Context instance', () => {
      const context = new Context({ a: 1, b: 2, c: 'hello' }, { prefix: '__data' });
      assert.equal(e('a + b', context), 3);
      assert.equal(e('c', context), 'hello');
    });

    it('should handle nested Context with parent lookup', () => {
      const parent = new Context({ x: 10, y: 20 }, { prefix: '__data' });
      const child = new Context({ y: 30, z: 40 }, { prefix: '__data' }, parent);

      assert.equal(e('x', child), 10); // from parent
      assert.equal(e('y', child), 30); // from child (shadows parent)
      assert.equal(e('z', child), 40); // from child
    });

    it('should work with Context.assign()', () => {
      const context = new Context({ a: 1 }, { prefix: '__data' });
      context.assign({ b: 2, c: 3 });
      console.log(context.bindings);

      assert.equal(e('a + b + c', context), 6);
    });

    it('should work with Context merge functionality', () => {
      const parent = new Context({ Array, count: 3, prefix: 'item_' }, { prefix: '__data' });
      const child = new Context({ suffix: '_end' }, { prefix: '__data' }, parent);

      assert.deepEqual(
        e('Array.from({ length: count }, (_, i) => prefix + i + suffix)', child),
        ['item_0_end', 'item_1_end', 'item_2_end']
      );
    });
  });

  describe('prefix with functions', () => {
    it('should not prefix function parameters', () => {
      const context = new Context({ Array, multiplier: 2 }, { prefix: '__data' });
      assert.deepEqual(
        e('Array.from({ length: 3 }, (value, index) => index * multiplier)', context),
        [0, 2, 4]
      );
    });

    it('should handle function expressions with prefix', () => {
      const context = new Context({ data: [1, 2, 3], factor: 10 }, { prefix: '__data' });
      assert.deepEqual(
        e('data.map(item => item * factor)', context),
        [10, 20, 30]
      );
    });

    it('should handle arrow functions with external variable access', () => {
      const context = new Context({ numbers: [1, 2, 3, 4, 5], threshold: 3 }, { prefix: '__data' });
      assert.deepEqual(
        e('numbers.filter(n => n > threshold)', context),
        [4, 5]
      );
    });

    it('should handle nested function calls with prefix', () => {
      const context = new Context({
        Array,
        base: 'PREFIX_',
        count: 2,
        transform: str => str.toUpperCase()
      }, { prefix: '__data' });

      assert.deepEqual(
        e('Array.from({ length: count }, (_, i) => transform(base + i))', context),
        ['PREFIX_0', 'PREFIX_1']
      );
    });
  });

  describe('prefix with object and array expressions', () => {
    it('should prefix variables in object expressions', () => {
      const context = { __data: { name: 'test', value: 42 } };
      assert.deepEqual(
        e('({ name, value, computed: name + "_" + value })', context),
        { name: 'test', value: 42, computed: 'test_42' }
      );
    });

    it('should prefix variables in array expressions', () => {
      const context = { __data: { first: 1, second: 2, third: 3 } };
      assert.deepEqual(
        e('[first, second, third, first + second + third]', context),
        [1, 2, 3, 6]
      );
    });

    it('should handle shorthand properties with prefix', () => {
      const context = { __data: { x: 10, y: 20 } };
      assert.deepEqual(
        e('({ x, y })', context),
        { x: 10, y: 20 }
      );
    });

    it('should handle computed properties with prefix', () => {
      const context = { __data: { key: 'dynamic', value: 'content' } };
      assert.deepEqual(
        e('({ [key]: value })', context),
        { dynamic: 'content' }
      );
    });
  });

  describe('prefix with member expressions', () => {
    it('should prefix object in member expressions', () => {
      const context = {
        __data: {
          user: { name: 'John', age: 30 },
          config: { debug: true, version: '1.0' }
        }
      };
      assert.equal(e('user.name', context), 'John');
      assert.equal(e('config.version', context), '1.0');
    });

    it('should handle computed member expressions with prefix', () => {
      const context = {
        __data: {
          data: { foo: 'bar', baz: 'qux' },
          key: 'foo'
        }
      };
      assert.equal(e('data[key]', context), 'bar');
    });

    it('should handle chained member expressions with prefix', () => {
      const context = {
        __data: {
          app: {
            user: {
              profile: {
                settings: {
                  theme: 'dark'
                }
              }
            }
          }
        }
      };
      assert.equal(e('app.user.profile.settings.theme', context), 'dark');
    });
  });

  describe('prefix with conditional expressions', () => {
    it('should prefix variables in ternary expressions', () => {
      const context = { __data: { isActive: true, activeValue: 'on', inactiveValue: 'off' } };
      assert.equal(
        e('isActive ? activeValue : inactiveValue', context),
        'on'
      );
    });

    it('should prefix variables in logical expressions', () => {
      const context = { __data: { a: null, b: 'fallback', c: 'primary' } };
      assert.equal(e('a || b', context), 'fallback');
      assert.equal(e('c && b', context), 'fallback');
      assert.equal(e('a ?? b', context), 'fallback');
    });
  });

  describe('prefix with template literals', () => {
    it('should prefix variables in template literals', () => {
      const context = { __data: { name: 'World', greeting: 'Hello' } };
      assert.equal(
        e('`${greeting}, ${name}!`', context),
        'Hello, World!'
      );
    });

    it('should handle complex expressions in template literals', () => {
      const context = { __data: { items: ['a', 'b', 'c'], separator: ', ' } };
      assert.equal(
        e('`Items: ${items.join(separator)}`', context),
        'Items: a, b, c'
      );
    });
  });

  describe('prefix with unary and update expressions', () => {
    it('should prefix variables in unary expressions', () => {
      const context = { __data: { flag: false, number: 5 } };
      assert.equal(e('!flag', context), true);
      assert.equal(e('typeof number', context), 'number');
      assert.equal(e('-number', context), -5);
    });

    it('should prefix variables in update expressions', () => {
      const context = new Context({ counter: 5 }, { prefix: '__data' });
      assert.equal(e('++counter', context), 6);
      assert.equal(context.counter, 6);

      assert.equal(e('counter--', context), 5);
      assert.equal(context.counter, 5);
    });
  });

  describe('prefix edge cases', () => {
    it('should handle this expressions with prefix', () => {
      const context = { __data: { this: { value: 'context this' } } };
      assert.deepEqual(e('this', context), { value: 'context this' });
    });

    it('should work without prefix option', () => {
      const noPrefixOpts = { ...opts, prefix: null };
      const context = { a: 1, b: 2 };
      assert.equal(e('a + b', context, noPrefixOpts), 3);
    });

    it('should handle empty prefix', () => {
      const emptyPrefixOpts = { ...opts, prefix: '' };
      const context = { a: 1, b: 2 };
      assert.equal(e('a + b', context, emptyPrefixOpts), 3);
    });

    it('should handle special characters in prefix', () => {
      const specialOpts = { ...opts, prefix: '$scope' };
      const context = { $scope: { value: 'special' } };
      assert.equal(e('value', context, specialOpts), 'special');
    });
  });

  describe('prefix performance', () => {
    it('should handle prefix efficiently in loops', () => {
      const context = new Context({ Array, limit: 1_000_000, multiplier: 2 }, { prefix: '__data' });
      const result = e('Array.from({ length: limit }, (_, i) => i * multiplier)', context);

      assert.equal(result.length, 1000000);
      assert.equal(result[0], 0);
      assert.equal(result[999999], 1999998);
    });

    it('should maintain performance with nested contexts', () => {
      const parent = new Context({ Array, base: 10 }, { prefix: '__data' });
      const child = new Context({ offset: 5 }, { prefix: '__data' }, parent);

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        e('base + offset', child);
      }
      const end = Date.now();

      assert.ok(end - start < 100, 'Performance test failed');
    });
  });

  describe('prefix with sync evaluation', () => {
    it('should work with synchronous evaluation', () => {
      const context = { __data: { x: 10, y: 20 } };
      assert.equal(evaluate.sync('x + y', context, opts), 30);
    });

    it('should handle Context with sync evaluation', () => {
      const context = new Context({ a: 5, b: 3 }, { prefix: '__data' });
      assert.equal(evaluate.sync('a * b', context, opts), 15);
    });

    it('should handle functions with sync evaluation', () => {
      const context = {
        __data: {
          numbers: [1, 2, 3],
          double: x => x * 2
        }
      };
      assert.deepEqual(evaluate.sync('numbers.map(double)', context, opts), [2, 4, 6]);
    });
  });
});
