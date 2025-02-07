'use strict';

const assert = require('node:assert/strict');
const { evaluate: e, variables } = require('../support');

/**
 * Tests from expr-eval library
 * Licensed under the MIT License.
 * Copyright (c) 2015 Matthew Crumley
 */

const opts = { functions: true };

describe('Expression', () => {
  describe('evaluate()', () => {
    it('2 ^ x', () => {
      assert.equal(e.sync('2 ^ x', { x: 3 }), 1);
    });

    it('2 * x + 1', () => {
      assert.equal(e.sync('2 * x + 1', { x: 3 }), 7);
    });

    it('2 + 3 * x', () => {
      assert.equal(e.sync('2 + 3 * x', { x: 4 }), 14);
    });

    it('(2 + 3) * x', () => {
      assert.equal(e.sync('(2 + 3) * x', { x: 4 }), 20);
    });

    it('2-3^x', () => {
      assert.equal(e.sync('2-3^x', { x: 4 }), -5);
    });

    it('-2-3^x', () => {
      assert.equal(e.sync('-2-3^x', { x: 4 }), -1);
    });

    it('-3^x', () => {
      assert.equal(e.sync('-3^x', { x: 4 }), -7);
    });

    it('(-3)^x', () => {
      assert.equal(e.sync('(-3)^x', { x: 4 }), -7);
    });

    it('2 ^ x.y', () => {
      assert.equal(e.sync('2^x.y', { x: { y: 3 } }), 1);
    });

    it('2 + 3 * foo.bar.baz', () => {
      assert.equal(e.sync('2 + 3 * foo.bar.baz', { foo: { bar: { baz: 4 } } }), 14);
    });

    it('10/-1', () => {
      assert.equal(e.sync('10/-1'), -10);
    });

    it('10*-1', () => {
      assert.equal(e.sync('10*-1'), -10);
    });

    it('10*-x', () => {
      assert.equal(e.sync('10*-x', { x: 1 }), -10);
    });

    it('10+-1', () => {
      assert.equal(e.sync('10+-1'), 9);
    });

    it('10/+1', () => {
      assert.equal(e.sync('10/+1'), 10);
    });

    it('10*+1', () => {
      assert.equal(e.sync('10*+1'), 10);
    });

    it('10*+x', () => {
      assert.equal(e.sync('10*+x', { x: 1 }), 10);
    });

    it('10+ +1', () => {
      assert.equal(e.sync('10+ +1'), 11);
    });

    it('10/-2', () => {
      assert.equal(e.sync('10/-2'), -5);
    });

    it('2^-4', () => {
      assert.equal(e.sync('2^-4'), -2);
    });

    it('2^(-4)', () => {
      assert.equal(e.sync('2^(-4)'), -2);
    });

    it('"as" || "df"', () => {
      assert.equal(e.sync('"as" || "df"'), 'as');
    });

    it('[1, 2] || [3, 4] || [5, 6]', () => {
      assert.deepEqual(e.sync('[1, 2] || [3, 4] || [5, 6]'), [ 1, 2 ]);
    });

    it('should fail with undefined variables', () => {
      assert.throws(() => e.sync('x + 1', {}, { strict: true }), Error);
    });

    it('[1, 2, 3]', () => {
      assert.deepEqual(e.sync('[1, 2, 3]'), [1, 2, 3]);
    });

    it('[1, 2, 3, [4, [5, 6]]]', () => {
      assert.deepEqual(e.sync('[1, 2, 3, [4, [5, 6]]]'), [1, 2, 3, [4, [5, 6]]]);
    });

    it('["a", ["b", ["c"]], true, 1 + 2 + 3]', () => {
      assert.deepEqual(e.sync('["a", ["b", ["c"]], true, 1 + 2 + 3]'), ['a', ['b', ['c']], true, 6]);
    });

    it('should fail trying to call a non-function', () => {
      assert.throws(() => { e.sync('f()', { f: 2 }); }, Error);
    });

    it('$x * $y_+$a1*$z - $b2', () => {
      assert.equal(e.sync('$x * $y_+$a1*$z - $b2', { $a1: 3, $b2: 5, $x: 7, $y_: 9, $z: 11 }), 91);
    });

    it('max(conf.limits.lower, conf.limits.upper)', () => {
      assert.equal(e.sync('Math.max(conf.limits.lower, conf.limits.upper)', { Math, conf: { limits: { lower: 4, upper: 9 } } }, opts), 9);
    });

    it('fn.max(conf.limits.lower, conf.limits.upper)', () => {
      assert.equal(e.sync('fn.max(conf.limits.lower, conf.limits.upper)', { fn: { max: Math.max }, conf: { limits: { lower: 4, upper: 9 } } }, opts), 9);
    });

    it('[1, 2+3, 4*5, 6/7, [8, 9, 10], "1" || "1"]', () => {
      assert.equal(JSON.stringify(e.sync('[1, 2+3, 4*5, 6/7, [8, 9, 10], "1" || "1"]')), JSON.stringify([1, 5, 20, 6 / 7, [8, 9, 10], '1']));
    });

    it('1 ? 1 : 0', () => {
      assert.equal(e.sync('1 ? 1 : 0'), 1);
    });

    it('0 ? 1 : 0', () => {
      assert.equal(e.sync('0 ? 1 : 0'), 0);
    });

    it('1==1 || 2==1 ? 39 : 0', () => {
      assert.equal(e.sync('1==1 || 2==1 ? 39 : 0'), 39);
    });

    it('1==1 || 1==2 ? -4 + 8 : 0', () => {
      assert.equal(e.sync('1==1 || 1==2 ? -4 + 8 : 0'), 4);
    });

    it('3 && 6 ? 45 > 5 * 11 ? 3 * 3 : 2.4 : 0', () => {
      assert.equal(e.sync('3 && 6 ? 45 > 5 * 11 ? 3 * 3 : 2.4 : 0'), 2.4);
    });
  });

  describe('variables()', () => {
    it('["x", "y", "z.y.x"]', () => {
      assert.deepEqual(variables('x * (y * 3) + z.y.x'), ['x', 'y', 'z']);
    });

    it('a || b ? c + d : e * f', () => {
      assert.deepEqual(variables('(a || b) ? c + d : e * f'), ['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('$x * $y_+$a1*$z - $b2', () => {
      assert.deepEqual(variables('$x * $y_+$a1*$z - $b2'), ['$x', '$y_', '$a1', '$z', '$b2']);
    });

    it('user.age + 2', () => {
      assert.deepEqual(variables('user.age + 2'), ['user']);
    });

    it('user.age + 2 with { withMembers: false } option', () => {
      assert.deepEqual(variables('user.age + 2', { withMembers: false }), ['user']);
    });

    it('user.age + 2 with { withMembers: true } option', () => {
      assert.deepEqual(variables('user.age + 2', { withMembers: true }), ['user.age']);
    });

    it('x.y ? x.y.z : a.z with { withMembers: true } option', () => {
      assert.deepEqual(variables('x.y ? x.y.z : a.z', { withMembers: true }), ['x.y', 'x.y.z', 'a.z']);
    });

    it('x + x.y + x.z with { withMembers: true } option', () => {
      const input = 'x + x.y + x.z';
      assert.deepEqual(variables(input, { withMembers: true }), ['x', 'x.y', 'x.z']);
    });

    it('x.y < 3 ? 2 * x.y.z : a.z + 1 with { withMembers: true } option', () => {
      const input = 'x.y < 3 ? 2 * x.y.z : a.z + 1';
      assert.deepEqual(variables(input, { withMembers: true }), ['x.y', 'x.y.z', 'a.z']);
    });

    it('user.age with { withMembers: true } option', () => {
      assert.deepEqual(variables('user.age', { withMembers: true }), ['user.age']);
    });

    it('x with { withMembers: true } option', () => {
      assert.deepEqual(variables('x', { withMembers: true }), ['x']);
    });

    it('x with { withMembers: false } option', () => {
      assert.deepEqual(variables('x', { withMembers: false }), ['x']);
    });

    it('Math.max(conf.limits.lower, conf.limits.upper) with { withMembers: false } option', () => {
      const input = 'Math.max(conf.limits.lower, conf.limits.upper)';
      assert.deepEqual(variables(input, { withMembers: false }), ['conf', 'Math']);
    });

    it('Math.max(conf.limits.lower, conf.limits.upper) with { withMembers: true } option', () => {
      const input = 'Math.max(conf.limits.lower, conf.limits.upper)';
      assert.deepEqual(variables(input, { withMembers: true }), ['conf.limits.upper', 'conf.limits.lower', 'Math.max']);
    });

    it('fn.max(conf.limits.lower, conf.limits.upper) with { withMembers: false } option', () => {
      const input = 'fn.max(conf.limits.lower, conf.limits.upper)';
      assert.deepEqual(variables(input, { withMembers: false }), ['conf', 'fn']);
    });

    it('fn.max(conf.limits.lower, conf.limits.upper) with { withMembers: true } option', () => {
      const input = 'fn.max(conf.limits.lower, conf.limits.upper)';
      assert.deepEqual(variables(input, { withMembers: true }).sort(), ['fn.max', 'conf.limits.lower', 'conf.limits.upper'].sort());
    });
  });
});
