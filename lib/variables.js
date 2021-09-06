'use strict';

const variables = (ast, options = {}) => {
  const stack = [];
  const names = [];

  const visit = (node, fn, parent) => {
    Reflect.defineProperty(node, 'parent', { value: parent });
    fn(node, parent);

    if (node.right) visit(node.right, fn, node);
    if (node.left) visit(node.left, fn, node);
    if (node.object) visit(node.object, fn, node);
    if (node.callee) visit(node.callee, fn, node);
    if (node.argument) visit(node.argument, fn, node);
    if (node.property) visit(node.property, fn, node);
    if (node.alternate) visit(node.alternate, fn, node);
    if (node.consequent) visit(node.consequent, fn, node);
    if (node.test) visit(node.test, fn, node);

    if (node.expressions) {
      const length = node.expressions.length;
      for (let i = 0; i < length; i++) {
        visit(node.quasis[i], fn, node);
        visit(node.expressions[i], fn, node);
      }

      visit(node.quasis[length], fn, node);
      return;
    }

    if (node.properties) mapVisit(node.properties, fn, node);
    if (node.arguments) mapVisit(node.arguments, fn, node);
    if (node.elements) mapVisit(node.elements, fn, node);
    if (node.body) mapVisit(node.body, fn, node);
  };

  const mapVisit = (nodes, fn, parent) => {
    stack.push(parent);
    for (const child of nodes) visit(child, fn, parent);
    stack.pop();
  };

  visit(ast, (node, parent) => {
    if (node.type === 'Identifier') {
      if (node === parent?.property) {
        if (options.withMembers !== true) return;
        if (names.length === 0) return;
        names.push(`${names.pop()}.${node.name}`);
      } else if (!names.includes(node.name)) {
        names.push(node.name);
      }
    }
  });

  return [...new Set(names)].reverse();
};

module.exports = variables;
