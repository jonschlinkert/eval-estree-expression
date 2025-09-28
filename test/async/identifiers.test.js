'use strict';

const assert = require('node:assert/strict');
const { evaluate: e } = require('../support');

describe('identifiers', () => {
  it('should evaluate accessors', async () => {
    const foo = Promise.resolve('foo');
    const correct = Promise.resolve('correct');

    assert.equal(await e('a["b"]', { a: { b: Promise.resolve(correct) } }), 'correct');
    assert.equal(await e('a[b.c]', { a: { foo: correct }, b: { c: foo } }), 'correct');
    assert.equal(await e('a[b["c"]]', { a: { foo: correct }, b: { c: foo } }), 'correct');
    assert.equal(await e('a["b"].c', { a: { b: { c: correct } } }), 'correct');
    assert.equal(await e('a["b"].c["d"]', { a: { b: { c: { d: correct } } } }), 'correct');
    assert.equal(await e('a[b]', { a: { foo: correct }, b: foo }), 'correct');
  });

  it('should evaluate object properties', async () => {
    assert.deepEqual(await e('{z:"z"}'), { z: 'z' });
    assert.deepEqual(await e('{z:["z", b]}', { b: 'y' }), { z: ['z', 'y'] });
  });

  it('should evaluate indenfifiers', async () => {
    assert.equal(await e('a'), undefined);
    assert.equal(await e('a', { a: 'foo' }), 'foo');
    assert.equal(await e('a.b', { a: { b: Promise.resolve('bar') } }), 'bar');
    assert.equal(await e('a.b', { a: { b: undefined } }), undefined);
    assert.equal(await e('a.b', { a: {} }), undefined);
  });

  it('should throw when variables are undefined', async () => {
    await assert.rejects(() => e('{z}'), undefined);
    await assert.rejects(() => e('[z]'), undefined);
    assert.deepEqual(await e('[z]', { z: undefined }), [undefined]);
    assert.deepEqual(await e('{z:"undefined"}'), { z: 'undefined' });
  });

  it('should throw an error when object is undefined', () => {
    return assert.rejects(() => e('a.b'), /Cannot read property 'b' of undefined/);
  });
});
