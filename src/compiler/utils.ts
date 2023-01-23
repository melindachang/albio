import { Node, Identifier } from 'estree';

export function fetch_object(node: Node): Identifier {
  while (node.type === 'MemberExpression') node = node.object;
  return node as Identifier;
}

export function destringify(str: string): string {
  return eval(`(function() {return ${str}})()`);
}
