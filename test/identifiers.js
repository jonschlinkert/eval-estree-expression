'use strict';

const assert = require('assert').strict;
const { evaluate: e } = require('../index');

describe('identifiers', () => {
  it('should evaluate accessors', () => {
    assert.equal(e('a["b"]', { a: { b: 'correct' } }), 'correct');
    assert.equal(e('a[b.c]', { a: { foo: 'correct' }, b: { c: 'foo' } }), 'correct');
    assert.equal(e('a[b["c"]]', { a: { foo: 'correct' }, b: { c: 'foo' } }), 'correct');
    assert.equal(e('a["b"].c', { a: { b: { c: 'correct' } } }), 'correct');
    assert.equal(e('a["b"].c["d"]', { a: { b: { c: { d: 'correct' } } } }), 'correct');
    assert.equal(e('a[b]', { a: { foo: 'correct' }, b: 'foo' }), 'correct');
  });

  it('should evaluate indenfifiers', () => {
    assert.equal(e('a'), undefined);
    assert.equal(e('a', { a: 'foo' }), 'foo');
    assert.equal(e('a.b', { a: { b: 'bar' } }), 'bar');
  });

  it('should throw an error when object is undefined', () => {
    assert.throws(() => e('a.b'), /Cannot read property 'b' of undefined/);
  });
});
