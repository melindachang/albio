import { Node, Identifier } from 'estree';

export function fetchObject(node: Node): Identifier {
  while (node.type === 'MemberExpression') node = node.object;
  return node as Identifier;
}

export function destringify(str: string): string {
  return eval(`(function() {return ${str}})()`);
}
