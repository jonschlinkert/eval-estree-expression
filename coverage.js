'use strict';

const { handlers } = require('./index');

const methods = new Set([
  'ArrayExpression',
  'ArrowFunctionExpression',
  'AssignmentExpression',
  'AwaitExpression',
  'BinaryExpression',
  'BindExpression',
  'CallExpression',
  'ChainExpression',
  'ClassExpression',
  'ConditionalExpression',
  'DoExpression',
  'Expression',
  'FunctionExpression',
  'ImportExpression',
  'JSXEmptyExpression',
  'JSXMemberExpression',
  'LogicalExpression',
  'MemberExpression',
  'ModuleExpression',
  'NewExpression',
  'ObjectExpression',
  'OptionalCallExpression',
  'OptionalMemberExpression',
  'ParenthesizedExpression',
  'PipelineTopicExpression',
  'RecordExpression',
  'SequenceExpression',
  'TaggedTemplateExpression',
  'ThisExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSTypeCastExpression',
  'TupleExpression',
  'TypeCastExpression',
  'UnaryExpression',
  'UpdateExpression',
  'YieldExpression'
]);

for (const name of methods) {
  if (!handlers[name]) {
    console.log(name);
  }
}
