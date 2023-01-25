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
      return `${identifier} = $$element("${node.name}")`;
  }
}

export function generateAttrStr(identifiers: string[], node: ASTNode): string[] {
  if (!(node as ElementTag).attrs) return [];
  const identifier = identifiers[node.index];
  return Object.entries((node as ElementTag).attrs!).map(
    ([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`,
  );
}

export function createUniqueName(func: string): string {
  return `${func}_${(Math.random() + 1).toString(36).substring(7)}`;
}
