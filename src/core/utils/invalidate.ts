// import { Node, Identifier } from 'estree';

import Renderer from '@core/Renderer';
import { x, print } from 'code-red';
import { AssignmentExpression, Identifier, Node } from 'estree';
import { extract_names } from 'periscopic';

export function $invalidate(renderer: Renderer, rawExpression: string): any {
  let expression: Node = x`${rawExpression}`;

  let dependencies: Set<string> = new Set();
  extract_names(fetch_object((expression as AssignmentExpression).left)).forEach((name) =>
    dependencies.add(name),
  );

  [...dependencies].forEach((d) => (renderer.dirty![d] = true));

  return eval(print(expression).code);
};

export function fetch_object(node: Node): Identifier {
  while (node.type === 'MemberExpression') node = node.object;
  return node as Identifier;
};
