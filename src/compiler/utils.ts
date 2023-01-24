import { Node, Identifier } from 'estree';
import { ASTNode, Binding, ElementTag, TextTag } from './interfaces';

export function fetchObject(node: Node): Identifier {
  while (node.type === 'MemberExpression') node = node.object;
  return node as Identifier;
}

export function destringify(str: string): string {
  return eval(`(function() {return ${str}})()`);
}

export function generateNodeStr(identifiers: string[], node: ASTNode): string {
  const identifier = identifiers[node.index];
  switch (node.type) {
    case 'Text':
      return `${identifier} = $$text("${(node as TextTag).value.replace(/\n/g, '\\n')}")`;
    case 'Binding':
      return `${identifier}_value = $$text(${
        (node as Binding).data
      })\n${identifier} = $$text(${identifier}_value.data)`;
    default:
      return `${identifier} = document.createElement("${node.name}")`;
  }
}

export function generateAttrStr(identifiers: string[], node: ASTNode): string[] {
  if (!(node as ElementTag).attrs) return [];
  const identifier = identifiers[node.index];
  return Object.entries((node as ElementTag).attrs!).map(
    ([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`,
  );
}
