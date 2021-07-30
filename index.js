'use strict';

const expression = require('./lib/expression');
const expressionSync = require('./lib/expression-sync');
expression.inspect = require('./lib/inspect');

/**
 * Allow "expression" to be destructured
 */

expression.expression = expression;

/**
 * Expose `sync` properties for convenience
 */

expression.expressionSync = expressionSync;
expression.evaluate.sync = expressionSync.evaluate;
expression.handlers.sync = expressionSync.handlers;
expression.visit.sync = expressionSync.visit;
expression.sync = expressionSync;

module.exports = expression;
