'use strict';

const assert = require('assert/strict');
const { evaluate: e } = require('../support');

describe('identifiers', () => {
  it('should evaluate accessors', () => {
    assert.equal(e.sync('a["b"]', { a: { b: 'correct' } }), 'correct');
    assert.equal(e.sync('a[b.c]', { a: { foo: 'correct' }, b: { c: 'foo' } }), 'correct');
    assert.equal(e.sync('a[b["c"]]', { a: { foo: 'correct' }, b: { c: 'foo' } }), 'correct');
    assert.equal(e.sync('a["b"].c', { a: { b: { c: 'correct' } } }), 'correct');
    assert.equal(e.sync('a["b"].c["d"]', { a: { b: { c: { d: 'correct' } } } }), 'correct');
    assert.equal(e.sync('a[b]', { a: { foo: 'correct' }, b: 'foo' }), 'correct');
  });

  it('should evaluate object properties', () => {
    assert.deepEqual(e.sync('{z:"z"}'), { z: 'z' });
    assert.deepEqual(e.sync('{z:["z", b]}', { b: 'y' }), { z: ['z', 'y'] });
  });

  it('should evaluate indenfifiers', () => {
    assert.equal(e.sync('a'), undefined);
    assert.equal(e.sync('a', { a: 'foo' }), 'foo');
    assert.equal(e.sync('a.b', { a: { b: 'bar' } }), 'bar');
    assert.equal(e.sync('a.b', { a: { b: undefined } }), undefined);
    assert.equal(e.sync('a.b', { a: {} }), undefined);
  });

  it('should throw when variables are undefined', () => {
    assert.throws(() => e.sync('{z}'), undefined);
    assert.throws(() => e.sync('[z]'), undefined);
    assert.deepEqual(e.sync('[z]', { z: undefined }), [undefined]);
    assert.deepEqual(e.sync('{z:"undefined"}'), { z: 'undefined' });
  });

  it('should throw an error when object is undefined', () => {
    assert.throws(() => e.sync('a.b'), /Cannot read property 'b' of undefined/);
  });
});
