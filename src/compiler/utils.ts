import { Node, Identifier } from 'estree';
import { ASTNode, Binding, ElementTag, TextTag } from './interfaces';
import * as code_red from 'code-red';

export const parse = (source: string): Node =>
  code_red.parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  });

export function fetchObject(node: Node): Identifier {
  while (node.type === 'MemberExpression') node = node.object;
  return node as Identifier;
}

export function destringify(str: string): string {
  return eval(`(function() {return ${str}})()`);
}

export function generateNodeStr(identifiers: string[], node: ASTNode): Node[] {
  const identifier = identifiers[node.index];
  switch (node.type) {
    case 'Text':
      return code_red.b`${identifier} = $$text("${(node as TextTag).value}")`;
    case 'Binding':
      return code_red.b`${identifier}_value = $$text(${
        (node as Binding).data
      })\n${identifier} = $$text(${identifier}_value.data)`;
    default:
      return code_red.b`${identifier} = $$element("${node.name}")`;
  }
}

export function generateAttrStr(identifiers: string[], node: ASTNode): Node[] {
  if (!(node as ElementTag).attrs) return [];
  const identifier = identifiers[node.index];
  return Object.entries((node as ElementTag).attrs!).map(
    ([name, value]) => code_red.x`${identifier}.setAttribute("${name}", "${value}")`,
  );
}
