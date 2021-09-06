'use strict';

const assert = require('assert').strict;
const { expression, evaluate: e } = require('../support');
const opts = { functions: true };
const ctx = { Math };

/**
 * Tests from expr-eval library
 * Licensed under the MIT License.
 * Copyright (c) 2015 Matthew Crumley
 */

describe('Functions', () => {
  describe('sync', () => {
    describe('Math.round()', () => {
      // Simple cases
      it('should handle Math.round(663)', () => {
        assert.equal(e.sync('Math.round(663)', ctx, opts), 663);
      });

      it('should handle Math.round(662.79)', () => {
        assert.equal(e.sync('Math.round(662.79)', ctx, opts), 663);
      });

      // Big numbers
      it('should handle Math.round(3000000000000000000000000.1233)', () => {
        assert.equal(e.sync('Math.round(3000000000000000000000000.1233)', ctx, opts), 3000000000000000000000000.1);
      });

      it('should handle Math.round(-3000000000000000000000000.1233)', () => {
        assert.equal(e.sync('Math.round(-3000000000000000000000000.1233)', ctx, opts), -3000000000000000000000000.1);
      });
    });

    describe('Math.random()', () => {
      it('should return a number from zero to 1', () => {
        const evaluate = expression.sync('Math.random()', { functions: true });
        for (let i = 0; i < 1000; i++) {
          const x = evaluate({ Math });
          assert.ok(x >= 0 && x < 1);
        }
      });

      it('should return different numbers', () => {
        const evaluate = expression.sync('Math.random()', { functions: true });
        const distinct = {};
        let sum = 0;

        for (let i = 0; i < 1000; i++) {
          const x = evaluate({ Math });
          sum += x;
          distinct[x] = true;
        }

        // Technically, these could fail but that should be extremely rare
        assert.equal(Object.keys(distinct).length, 1000);
        assert.ok((sum / 1000 >= 0.4) && (sum / 1000 <= 0.6));
      });
    });

    describe('Math.min(a, b, ...)', () => {
      it('should return the smallest value', () => {
        assert.equal(e.sync('Math.min()', ctx, opts), Infinity);
        assert.equal(e.sync('Math.min([])', ctx, opts), 0);
        assert.equal(e.sync('Math.min(...[])', ctx, opts), Infinity);
        assert.equal(e.sync('Math.min(1)', ctx, opts), 1);
        assert.equal(e.sync('Math.min(1,2)', ctx, opts), 1);
        assert.equal(e.sync('Math.min(2,1)', ctx, opts), 1);
        assert.equal(e.sync('Math.min(2,1,0)', ctx, opts), 0);
        assert.equal(e.sync('Math.min(4,3,2,1,0,1,2,3,4,-5,6)', ctx, opts), -5);
        assert.equal(e.sync('Math.min(...[1,0,2,-4,8,-16,3.2])', ctx, opts), -16);
      });
    });

    describe('Math.max(a, b, ...)', () => {
      it('should return the largest value', () => {
        assert.equal(e.sync('Math.max()', ctx, opts), -Infinity);
        assert.equal(e.sync('Math.max(...[])', ctx, opts), -Infinity);
        assert.equal(e.sync('Math.max(1)', ctx, opts), 1);
        assert.equal(e.sync('Math.max(1,2)', ctx, opts), 2);
        assert.equal(e.sync('Math.max(2,1)', ctx, opts), 2);
        assert.equal(e.sync('Math.max(2,1,0)', ctx, opts), 2);
        assert.equal(e.sync('Math.max(4,3,2,1,0,1,2,3,4,-5,6)', ctx, opts), 6);
        assert.equal(e.sync('Math.max(...[1,0,2,-4,8,-16,3.2])', ctx, opts), 8);
      });
    });

    describe('Math.hypot(a, b, ...)', () => {
      it('should return the hypotenuse', () => {
        assert.equal(e.sync('Math.hypot()', ctx, opts), 0);
        assert.equal(e.sync('Math.hypot(3)', ctx, opts), 3);
        assert.equal(e.sync('Math.hypot(3,4)', ctx, opts), 5);
        assert.equal(e.sync('Math.hypot(4,3)', ctx, opts), 5);
        assert.equal(e.sync('Math.hypot(2,3,4)', ctx, opts), 5.385164807134504);
        assert.equal(e.sync('Math.hypot(1 / 0)', ctx, opts), Infinity);
        assert.equal(e.sync('Math.hypot(-1 / 0)', ctx, opts), Infinity);
        assert.equal(e.sync('Math.hypot(1, 2, 1 / 0)', ctx, opts), Infinity);
      });

      it('should avoid overflowing', () => {
        assert.equal(Math.abs(e.sync('Math.hypot(10^200, 10^200)', ctx, opts)), 274.35743110038044);
        assert.equal(Math.abs(e.sync('Math.hypot(10^-200, 10^-200)', ctx, opts)), 291.3279938488576);
        assert.equal(Math.abs(e.sync('Math.hypot(10^100, 11^100, 12^100, 13^100)', ctx, opts)), 215.08602929990596);
        assert.equal(e.sync('Math.hypot(x)', { Math, x: Number.MAX_VALUE }, opts), Number.MAX_VALUE);
        assert.equal(e.sync('Math.hypot(x, 0)', { Math, x: Number.MAX_VALUE }, opts), Number.MAX_VALUE);
      });
    });

    describe('Math.pow(x, y)', () => {
      it('should return x^y', () => {
        assert.equal(e.sync('Math.pow(3,2)', ctx, opts), 9);
      });
    });

    describe('atan2(y, x)', () => {
      it('should return atan(y / x)', () => {
        assert.equal(e.sync('Math.atan2(90, 15)', ctx, opts), 1.4056476493802699);
        assert.equal(e.sync('Math.atan2(15, 90)', ctx, opts), 0.16514867741462683);
        assert.equal(e.sync('Math.atan2(0, 0)', ctx, opts), 0);
        assert.equal(e.sync('Math.atan2(0, 1)', ctx, opts), 0);
        assert.equal(e.sync('Math.atan2(1, 0)', ctx, opts), Math.PI / 2);
        assert.equal(e.sync('Math.atan2(0, 1/-inf)', { Math, inf: Infinity }, opts), Math.PI);
        assert.equal(e.sync('Math.atan2(1/-inf, 1/-inf)', { Math, inf: Infinity }, opts), -Math.PI);
      });
    });

    describe('[].map(f, a)', () => {
      it('should work on empty arrays', () => {
        assert.deepEqual(e.sync('[].map(Math.random)', ctx, opts), []);
      });

      it('should fail if argument is not a function', () => {
        assert.throws(() => e.sync('[].map(4)', ctx, opts), /not a function/);
      });

      it('should call built-in functions', () => {
        assert.deepEqual(e.sync('[0, 1, 16, 81].map(Math.sqrt)', ctx, opts), [ 0, 1, 4, 9 ]);
        assert.deepEqual(e.sync('[2, -2, -2, -3, 4, -5].map(Math.abs)', ctx, opts), [ 2, 2, 2, 3, 4, 5 ]);
      });
    });
  });

  describe('async', () => {
    describe('Math.round()', () => {
    // Simple cases
      it('should handle Math.round(663)', async () => {
        assert.equal(await e('Math.round(663)', ctx, opts), 663);
      });

      it('should handle Math.round(662.79)', async () => {
        assert.equal(await e('Math.round(662.79)', ctx, opts), 663);
      });

      // Big numbers
      it('should handle Math.round(3000000000000000000000000.1233)', async () => {
        assert.equal(await e('Math.round(3000000000000000000000000.1233)', ctx, opts), 3000000000000000000000000.1);
      });

      it('should handle Math.round(-3000000000000000000000000.1233)', async () => {
        assert.equal(await e('Math.round(-3000000000000000000000000.1233)', ctx, opts), -3000000000000000000000000.1);
      });
    });

    describe('Math.random()', () => {
      it('should return a number from zero to 1', async () => {
        const evaluate = expression.sync('Math.random()', { functions: true });
        for (let i = 0; i < 1000; i++) {
          const x = evaluate({ Math });
          assert.ok(x >= 0 && x < 1);
        }
      });

      it('should return different numbers', async () => {
        const evaluate = expression.sync('Math.random()', { functions: true });
        const distinct = {};
        let sum = 0;

        for (let i = 0; i < 1000; i++) {
          const x = evaluate({ Math });
          sum += x;
          distinct[x] = true;
        }

        // Technically, these could fail but that should be extremely rare
        assert.equal(Object.keys(distinct).length, 1000);
        assert.ok((sum / 1000 >= 0.4) && (sum / 1000 <= 0.6));
      });
    });

    describe('Math.min(a, b, ...)', () => {
      it('should return the smallest value', async () => {
        assert.equal(await e('Math.min()', ctx, opts), Infinity);
        assert.equal(await e('Math.min([])', ctx, opts), 0);
        assert.equal(await e('Math.min(...[])', ctx, opts), Infinity);
        assert.equal(await e('Math.min(1)', ctx, opts), 1);
        assert.equal(await e('Math.min(1,2)', ctx, opts), 1);
        assert.equal(await e('Math.min(2,1)', ctx, opts), 1);
        assert.equal(await e('Math.min(2,1,0)', ctx, opts), 0);
        assert.equal(await e('Math.min(4,3,2,1,0,1,2,3,4,-5,6)', ctx, opts), -5);
        assert.equal(await e('Math.min(...[1,0,2,-4,8,-16,3.2])', ctx, opts), -16);
      });
    });

    describe('Math.max(a, b, ...)', () => {
      it('should return the largest value', async () => {
        assert.equal(await e('Math.max()', ctx, opts), -Infinity);
        assert.equal(await e('Math.max(...[])', ctx, opts), -Infinity);
        assert.equal(await e('Math.max(1)', ctx, opts), 1);
        assert.equal(await e('Math.max(1,2)', ctx, opts), 2);
        assert.equal(await e('Math.max(2,1)', ctx, opts), 2);
        assert.equal(await e('Math.max(2,1,0)', ctx, opts), 2);
        assert.equal(await e('Math.max(4,3,2,1,0,1,2,3,4,-5,6)', ctx, opts), 6);
        assert.equal(await e('Math.max(...[1,0,2,-4,8,-16,3.2])', ctx, opts), 8);
      });
    });

    describe('Math.hypot(a, b, ...)', () => {
      it('should return the hypotenuse', async () => {
        assert.equal(await e('Math.hypot()', ctx, opts), 0);
        assert.equal(await e('Math.hypot(3)', ctx, opts), 3);
        assert.equal(await e('Math.hypot(3,4)', ctx, opts), 5);
        assert.equal(await e('Math.hypot(4,3)', ctx, opts), 5);
        assert.equal(await e('Math.hypot(2,3,4)', ctx, opts), 5.385164807134504);
        assert.equal(await e('Math.hypot(1 / 0)', ctx, opts), Infinity);
        assert.equal(await e('Math.hypot(-1 / 0)', ctx, opts), Infinity);
        assert.equal(await e('Math.hypot(1, 2, 1 / 0)', ctx, opts), Infinity);
      });

      it('should avoid overflowing', async () => {
        assert.equal(Math.abs(await e('Math.hypot(10^200, 10^200)', ctx, opts)), 274.35743110038044);
        assert.equal(Math.abs(await e('Math.hypot(10^-200, 10^-200)', ctx, opts)), 291.3279938488576);
        assert.equal(Math.abs(await e('Math.hypot(10^100, 11^100, 12^100, 13^100)', ctx, opts)), 215.08602929990596);
        assert.equal(await e('Math.hypot(x)', { Math, x: Number.MAX_VALUE }, opts), Number.MAX_VALUE);
        assert.equal(await e('Math.hypot(x, 0)', { Math, x: Number.MAX_VALUE }, opts), Number.MAX_VALUE);
      });
    });

    describe('Math.pow(x, y)', () => {
      it('should return x^y', async () => {
        assert.equal(await e('Math.pow(3,2)', ctx, opts), 9);
      });
    });

    describe('atan2(y, x)', () => {
      it('should return atan(y / x)', async () => {
        assert.equal(await e('Math.atan2(90, 15)', ctx, opts), 1.4056476493802699);
        assert.equal(await e('Math.atan2(15, 90)', ctx, opts), 0.16514867741462683);
        assert.equal(await e('Math.atan2(0, 0)', ctx, opts), 0);
        assert.equal(await e('Math.atan2(0, 1)', ctx, opts), 0);
        assert.equal(await e('Math.atan2(1, 0)', ctx, opts), Math.PI / 2);
        assert.equal(await e('Math.atan2(0, 1/-inf)', { Math, inf: Infinity }, opts), Math.PI);
        assert.equal(await e('Math.atan2(1/-inf, 1/-inf)', { Math, inf: Infinity }, opts), -Math.PI);
      });
    });

    describe('[].map(f, a)', () => {
      it('should work on empty arrays', async () => {
        assert.deepEqual(await e('[].map(Math.random)', ctx, opts), []);
      });

      it('should fail if argument is not a function', async () => {
        return assert.rejects(() => e('[].map(4)', ctx, opts), /not a function/);
      });

      it('should call built-in functions', async () => {
        assert.deepEqual(await e('[0, 1, 16, 81].map(Math.sqrt)', ctx, opts), [ 0, 1, 4, 9 ]);
        assert.deepEqual(await e('[2, -2, -2, -3, 4, -5].map(Math.abs)', ctx, opts), [ 2, 2, 2, 3, 4, 5 ]);
      });
    });
  });
});
