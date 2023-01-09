import { DirtMarker } from '../interfaces';
import { scheduleUpdate } from './schedule.js';
import { print } from 'code-red';
import { AssignmentExpression, Identifier, Node } from 'estree';
import { extract_names } from 'periscopic';

export function $$invalidate(dirty: DirtMarker, expression: Node, update: () => void): any {
  let dependencies: Set<string> = new Set();
  extract_names(fetch_object((expression as AssignmentExpression).left)).forEach((name) =>
    dependencies.add(name),
  );

  [...dependencies].forEach((d) => (dirty![d] = true));

  scheduleUpdate(update);

  return eval(print(expression).code);
}

export function fetch_object(node: Node): Identifier {
  while (node.type === 'MemberExpression') node = node.object;
  return node as Identifier;
}
