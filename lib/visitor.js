'use strict';

// let decorated = false;
// const createHandlers = (handlers, options = {}) => {
//   if (decorated) return exports.handlers;
//   decorated = true;

//   if (options.functions === true) {
//     exports.handlers = require('./functions')(visit, exports.handlers);
//   }

//   if (options.handlers) {
//     exports.handlers = options.handlers(visit, exports.handlers);
//   }

//   return exports.handlers;
// };

module.exports = handlers => {
  return (node, ...args) => {
    const handler = handlers[node.type];

    if (typeof handler !== 'function') {
      throw new TypeError(`Handler "${node.type}" is not implemented`);
    }

    return handler(node, ...args);
  };
};
