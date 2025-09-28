'use strict';

const setValue = require('set-value');
const { default: getValue } = require('get-value');

class Context {
  constructor(bindings, options, parent = null) {
    this.options = { ...options };
    this.bindings = { ...bindings };
    this.parent = parent;

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        return target.lookup(prop);
      },

      getOwnPropertyDescriptor: (target, prop) => {
        if (prop in this.bindings) {
          const descriptor = Object.getOwnPropertyDescriptor(this.bindings, prop);

          if (descriptor) {
            // Must be configurable for Object.assign/spread to work
            descriptor.configurable = true;
            return descriptor;
          }

          return;
        }

        // Only return descriptors for this properties when explicitly accessed
        // but not during enumeration/spreading
        if (prop in this) {
          return Object.getOwnPropertyDescriptor(this, prop);
        }

        return undefined;
      },

      set: (target, prop, value) => {
        if (prop in this) {
          return Reflect.set(this, prop, value);
        }

        this.set(prop, value);
        return true;
      }
    });
  }

  set(key, value) {
    setValue(this.bindings, key, value);

    if (this.options.prefix && key.startsWith(this.options.prefix)) {
      key = key.slice(this.options.prefix.length);

      if (key.startsWith('.')) {
        key = key.slice(1);
      }

      setValue(this.bindings, key, value);
    }
  }

  get(key) {
    if (this.options.prefix && key.startsWith(this.options.prefix)) {
      key = key.slice(this.options.prefix.length);

      if (key.startsWith('.')) {
        key = key.slice(1);
      }
    }

    const value = getValue(this.bindings, key);
    return value;
  }

  lookup(key) {
    return this.get(key) ?? this.parent?.lookup(key);
  }

  assign(data) {
    this.bindings = { ...this.bindings, ...data };
  }

  merge() {
    return { ...this.parent?.merge(), ...this.bindings };
  }

  * [Symbol.iterator]() {
    for (const [key, value] of Object.entries(this.bindings)) {
      yield [key, value];
    }
  }
}

exports.Context = Context;
module.exports = Context;
