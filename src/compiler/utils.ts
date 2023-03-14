import { Node, Identifier, CallExpression, Expression } from 'estree';
import { ASTNode, Binding, ElementTag, Reference, TextTag } from './interfaces';
import * as code_red from 'code-red';
import { walk } from 'estree-walker';

export const parse = (source: string): Node =>
  code_red.parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  });

export function isReference(item: Reference | Binding): item is Reference {
  return (item as Reference).var !== undefined;
}

export function hasArguments(call: string) {
  const exp = parse(call);
  let args = false;
  walk(exp, {
    enter(node) {
      if (node.type === 'CallExpression' && (node as CallExpression).arguments.length) args = true;
    },
  });
  return args;
}

export function generateToggleClassStr(identifiers: string[], ref: Reference): Node {
  return code_red.x`$$toggle_class(${identifiers[ref.index]}, "${ref.var}", ${ref.ref})`;
}

export function get_associated_events(bound: string): string[] {
  switch (bound) {
    case 'value':
      return ['input'];
    case 'checked':
      return ['change'];
    default:
      return [];
  }
}

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

export function render_ref_check(
  dirty_exp: Expression,
  identifiers: string[],
  ref: Reference,
): Node[] {
  switch (ref.var) {
    case 'value': {
      return code_red.b`
      if (${dirty_exp} && ${`${identifiers[ref.index]}.${ref.var}`} !== ${ref.ref})
        $$set_attr_data(${identifiers[ref.index]}, "value", ${ref.ref})
      `;
    }
    case 'checked': {
      return code_red.b`
      if (${dirty_exp})
        ${identifiers[ref.index]}.checked = ${ref.ref}
      `;
    }
    default:
      return code_red.b``;
  }
}
