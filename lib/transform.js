'use strict';

/**
 * Make nodes compatible with escodegen.
 */

function forEscodegen(node) {
  if (!node || typeof node !== 'object') {
    return node;
  }

  switch (node.type) {
    case 'StringLiteral':
      node.type = 'Literal';
      node.raw = `"${node.value}"`;
      break;
    case 'NumericLiteral':
      node.type = 'Literal';
      node.raw = String(node.value);
      break;
    case 'BooleanLiteral':
      node.type = 'Literal';
      node.raw = String(node.value);
      break;
    case 'NullLiteral':
      node.type = 'Literal';
      node.value = null;
      node.raw = 'null';
      break;
    case 'RegExpLiteral':
      node.type = 'Literal';
      node.value = new RegExp(node.pattern, node.flags);
      node.regex = { pattern: node.pattern, flags: node.flags };
      node.raw = `/${node.pattern}/${node.flags}`;
      break;
    case 'BigIntLiteral':
      node.type = 'Literal';
      node.value = BigInt(node.value);
      node.raw = `${node.value}n`;
      node.bigint = node.value;
      break;
    default: {
      break;
    }
  }

  if (node.properties) {
    node.properties = node.properties.map(property => {
      const prop = forEscodegen(property);

      if (property.type === 'ObjectProperty') {
        prop.type = 'Property';
        prop.kind = 'init';
        return prop;
      }

      return prop;
    });
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === 'type' || child == null || typeof child !== 'object') continue;

    if (Array.isArray(child)) {
      node[key] = child.map(n => forEscodegen(n));
    } else {
      node[key] = forEscodegen(child);
    }
  }

  return node;
}

module.exports = {
  forEscodegen
};
