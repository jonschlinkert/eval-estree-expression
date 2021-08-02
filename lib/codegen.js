'use strict';

const codegen = expression => {
  const visit = expression.visit.bind(expression);
  const state = expression.state;
  state.indent = 0;

  return {
    generate(node) {
      return visit(node);
    },
    BlockStatement(node) {
      return node.body.map(n => visit(n, state)).join('');
    },
    BooleanLiteral(node) {
      return node.value;
    },
    FunctionExpression(node) {
      const name = node.id?.name ? ` ${node.id.name}` : '';
      const output = [`function${name}(`];
      output.push(node.params.map(param => param.name).join(', '));
      output.push(') {');
      output.push('\n');
      state.indent += 2;
      output.push(visit(node.body));
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
    ReturnStatement(node) {
      return ' '.repeat(state.indent) + `return ${node.argument.name};`;
    }
  };
};

module.exports = codegen;
