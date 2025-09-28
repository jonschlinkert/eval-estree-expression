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

  return evaluate(input, context, { ...opts, ...options });
};

describe('prefix support', () => {
  describe('basic prefix functionality', () => {
    it('should prefix simple identifiers', async () => {
      const data = { __data: { a: 1, b: 2 } };
      assert.equal(await e('a', data), 1);
      assert.equal(await e('b', data), 2);
    });

    it('should prefix identifiers in expressions', async () => {
      const data = { __data: { x: 5, y: 3 } };
      assert.equal(await e('x + y', data), 8);
      assert.equal(await e('x * y', data), 15);
      assert.equal(await e('x - y', data), 2);
    });

    it('should prefix nested property access', async () => {
      const data = { __data: { obj: { prop: 'value' } } };
      assert.equal(await e('obj.prop', data), 'value');
    });

    it('should not double-prefix already prefixed identifiers', async () => {
      const data = { __data: { a: 1 }, '__data.b': 2 };
      assert.equal(await e('__data.a', data), 1);
      assert.equal(await e('__data.b', data), 2);
    });

    it('should handle undefined variables with prefix', async () => {
      const data = { __data: {} };
      assert.equal(await e('nonexistent', data), undefined);
    });

    it('should work with custom prefix', async () => {
      const customOpts = { ...opts, prefix: 'ctx' };
      const data = { ctx: { value: 42 } };
      assert.equal(await e('value', data, customOpts), 42);
    });
  });

  describe('prefix with Context class', () => {
    it('should work with Context instance', async () => {
      const context = new Context({ a: 1, b: 2, c: 'hello' }, { prefix: '__data' });
      assert.equal(await e('a + b', context), 3);
      assert.equal(await e('c', context), 'hello');
    });

    it('should handle nested Context with parent lookup', async () => {
      const parent = new Context({ x: 10, y: 20 }, { prefix: '__data' });
      const child = new Context({ y: 30, z: 40 }, { prefix: '__data' }, parent);

      assert.equal(await e('x', child), 10); // from parent
      assert.equal(await e('y', child), 30); // from child (shadows parent)
      assert.equal(await e('z', child), 40); // from child
    });

    it('should work with Context.assign()', async () => {
      const context = new Context({ a: 1 }, { prefix: '__data' });
      context.assign({ b: 2, c: 3 });
      console.log(context.bindings);

      assert.equal(await e('a + b + c', context), 6);
    });

    it('should work with Context merge functionality', async () => {
      const parent = new Context({ Array, count: 3, prefix: 'item_' }, { prefix: '__data' });
      const child = new Context({ suffix: '_end' }, { prefix: '__data' }, parent);

      assert.deepEqual(
        await e('Array.from({ length: count }, (_, i) => prefix + i + suffix)', child),
        ['item_0_end', 'item_1_end', 'item_2_end']
      );
    });
  });

  describe('prefix with functions', () => {
    it('should not prefix function parameters', async () => {
      const context = new Context({ Array, multiplier: 2 }, { prefix: '__data' });
      assert.deepEqual(
        await e('Array.from({ length: 3 }, (value, index) => index * multiplier)', context),
        [0, 2, 4]
      );
    });

    it('should handle function expressions with prefix', async () => {
      const context = new Context({ data: [1, 2, 3], factor: 10 }, { prefix: '__data' });
      assert.deepEqual(
        await e('data.map(item => item * factor)', context),
        [10, 20, 30]
      );
    });

    it('should handle arrow functions with external variable access', async () => {
      const context = new Context({ numbers: [1, 2, 3, 4, 5], threshold: 3 }, { prefix: '__data' });
      assert.deepEqual(
        await e('numbers.filter(n => n > threshold)', context),
        [4, 5]
      );
    });

    it('should handle nested function calls with prefix', async () => {
      const context = new Context({
        Array,
        base: 'PREFIX_',
        count: 2,
        transform: str => str.toUpperCase()
      }, { prefix: '__data' });

      assert.deepEqual(
        await e('Array.from({ length: count }, (_, i) => transform(base + i))', context),
        ['PREFIX_0', 'PREFIX_1']
      );
    });
  });

  describe('prefix with object and array expressions', () => {
    it('should prefix variables in object expressions', async () => {
      const context = { __data: { name: 'test', value: 42 } };
      assert.deepEqual(
        await e('({ name, value, computed: name + "_" + value })', context),
        { name: 'test', value: 42, computed: 'test_42' }
      );
    });

    it('should prefix variables in array expressions', async () => {
      const context = { __data: { first: 1, second: 2, third: 3 } };
      assert.deepEqual(
        await e('[first, second, third, first + second + third]', context),
        [1, 2, 3, 6]
      );
    });

    it('should handle shorthand properties with prefix', async () => {
      const context = { __data: { x: 10, y: 20 } };
      assert.deepEqual(
        await e('({ x, y })', context),
        { x: 10, y: 20 }
      );
    });

    it('should handle computed properties with prefix', async () => {
      const context = { __data: { key: 'dynamic', value: 'content' } };
      assert.deepEqual(
        await e('({ [key]: value })', context),
        { dynamic: 'content' }
      );
    });
  });

  describe('prefix with member expressions', () => {
    it('should prefix object in member expressions', async () => {
      const context = {
        __data: {
          user: { name: 'John', age: 30 },
          config: { debug: true, version: '1.0' }
        }
      };
      assert.equal(await e('user.name', context), 'John');
      assert.equal(await e('config.version', context), '1.0');
    });

    it('should handle computed member expressions with prefix', async () => {
      const context = {
        __data: {
          data: { foo: 'bar', baz: 'qux' },
          key: 'foo'
        }
      };
      assert.equal(await e('data[key]', context), 'bar');
    });

    it('should handle chained member expressions with prefix', async () => {
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
      assert.equal(await e('app.user.profile.settings.theme', context), 'dark');
    });
  });

  describe('prefix with conditional expressions', () => {
    it('should prefix variables in ternary expressions', async () => {
      const context = { __data: { isActive: true, activeValue: 'on', inactiveValue: 'off' } };
      assert.equal(
        await e('isActive ? activeValue : inactiveValue', context),
        'on'
      );
    });

    it('should prefix variables in logical expressions', async () => {
      const context = { __data: { a: null, b: 'fallback', c: 'primary' } };
      assert.equal(await e('a || b', context), 'fallback');
      assert.equal(await e('c && b', context), 'fallback');
      assert.equal(await e('a ?? b', context), 'fallback');
    });
  });

  describe('prefix with template literals', () => {
    it('should prefix variables in template literals', async () => {
      const context = { __data: { name: 'World', greeting: 'Hello' } };
      assert.equal(
        await e('`${greeting}, ${name}!`', context),
        'Hello, World!'
      );
    });

    it('should handle complex expressions in template literals', async () => {
      const context = { __data: { items: ['a', 'b', 'c'], separator: ', ' } };
      assert.equal(
        await e('`Items: ${items.join(separator)}`', context),
        'Items: a, b, c'
      );
    });
  });

  describe('prefix with unary and update expressions', () => {
    it('should prefix variables in unary expressions', async () => {
      const context = { __data: { flag: false, number: 5 } };
      assert.equal(await e('!flag', context), true);
      assert.equal(await e('typeof number', context), 'number');
      assert.equal(await e('-number', context), -5);
    });

    it('should prefix variables in update expressions', async () => {
      const context = new Context({ counter: 5 }, { prefix: '__data' });
      assert.equal(await e('++counter', context), 6);
      assert.equal(context.counter, 6);

      assert.equal(await e('counter--', context), 5);
      assert.equal(context.counter, 5);
    });
  });

  describe('prefix edge cases', () => {
    it('should handle this expressions with prefix', async () => {
      const context = { __data: { this: { value: 'context this' } } };
      assert.deepEqual(await e('this', context), { value: 'context this' });
    });

    it('should work without prefix option', async () => {
      const noPrefixOpts = { ...opts, prefix: null };
      const context = { a: 1, b: 2 };
      assert.equal(await e('a + b', context, noPrefixOpts), 3);
    });

    it('should handle empty prefix', async () => {
      const emptyPrefixOpts = { ...opts, prefix: '' };
      const context = { a: 1, b: 2 };
      assert.equal(await e('a + b', context, emptyPrefixOpts), 3);
    });

    it('should handle special characters in prefix', async () => {
      const specialOpts = { ...opts, prefix: '$scope' };
      const context = { $scope: { value: 'special' } };
      assert.equal(await e('value', context, specialOpts), 'special');
    });
  });

  describe('prefix performance', () => {
    it('should handle prefix efficiently in loops', async () => {
      const context = new Context({ Array, limit: 1_000_000, multiplier: 2 }, { prefix: '__data' });
      const result = await e('Array.from({ length: limit }, (_, i) => i * multiplier)', context);

      assert.equal(result.length, 1000000);
      assert.equal(result[0], 0);
      assert.equal(result[999999], 1999998);
    });

    it('should maintain performance with nested contexts', async () => {
      const parent = new Context({ Array, base: 10 }, { prefix: '__data' });
      const child = new Context({ offset: 5 }, { prefix: '__data' }, parent);

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        await e('base + offset', child);
      }
      const end = Date.now();

      assert.ok(end - start < 100, 'Performance test failed');
    });
  });
});
