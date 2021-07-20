'use strict';

const babel = require('@babel/parser');
const createSyncHandlers = require('./lib/handlers');
const createAsyncHandlers = require('./lib/handlers-async');

const create = (state = {}) => {
  const parse = (input, options) => {
    return babel.parseExpression(input, options);
  };

  const visit = (node, context) => {
    const handler = asyncHandlers[node.type];

    if (typeof handler !== 'function') {
      throw new TypeError(`Handler "${node.type}" is not implemented`);
    }

    return handler(node, context);
  };

  const visitSync = visit.sync = (node, context) => {
    const handler = syncHandlers[node.type];

    if (typeof handler !== 'function') {
      throw new TypeError(`Handler "${node.type}" is not implemented`);
    }

    return handler(node, context);
  };

  const evaluate = (input, context = {}, options) => {
    return visit(parse(input, options), context);
  };

  const evaluateSync = evaluate.sync = (input, context = {}, options) => {
    return visit.sync(parse(input, options), context);
  };

  const syncHandlers = createSyncHandlers(visit.sync, state);
  const asyncHandlers = createAsyncHandlers(visit, state);

  return {
    asyncHandlers,
    syncHandlers,
    parse,
    visit,
    visitSync,
    evaluate,
    evaluateSync
  };
};

module.exports = create();
