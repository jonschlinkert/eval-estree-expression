'use strict';

const visitor = require('./visitor');

const handlers = {
  BlockStatement(node, state) {
    return node.body.map(n => visit(n, state)).join('');
  },
  BooleanLiteral(node) {
    return node.value;
  },
  FunctionExpression(node, state = {}) {
    const name = node.id?.name ? ` ${node.id.name}` : '';
    const output = [`function${name}(`];
    output.push(node.params.map(param => param.name).join(', '));
    output.push(') {');
    output.push('\n');
    state.indent += 2;
    output.push(visit(node.body, state));
    state.indent -= 2;
    output.push('\n');
    output.push('}');
    return output.join('');
  },
  Literal(node) {
    return node.value;
  },
  Identifier(node) {
    return node.name;
  },
  RegExpLiteral(node) {
    return new RegExp(node.pattern, node.flags);
  },
  ReturnStatement(node, state) {
    return ' '.repeat(state.indent) + `return ${node.argument.name};`;
  }
};

const visit = visitor(handlers);
const generate = node => visit(node, { indent: 0 });
module.exports = generate;
