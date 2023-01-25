import { Text } from 'domhandler';
import { EachBlock } from '../interfaces';
import Wrapper from './Wrapper';
import { createUniqueName, parse } from '../utils';
import { analyze, Scope } from 'periscopic';
import { x } from 'code-red';
import { Node } from 'estree';

/**
 * What must be done:
 * - Construct a new EachBlockWrapper for every EachBlock discovered
 * - Generate instructions to create_each_block with unique content upon createComponent()
 * - When a reassignment occurs, 1. remove elements from DOM, 2. regenerate elements, 3. append to DOM
 * - Would be nice to have optimizations here so that it doesn't replace every single element every time
 */

interface IterableKey {
  name: string;
  variableRef: string;
}

export default class EachBlockWrapper extends Wrapper {
  identifier: string;
  iterable: string;
  keys: IterableKey[];

  constructor(block: EachBlock) {
    super(block);
    this.identifier = createUniqueName('create_each_block');

    const segments = (this.startNode as Text).data.split(' ');
    this.iterable = segments[1];

    const regex = /[^\w.-]+/g;
    const i = segments.indexOf('as');
    if (!segments[i + 1].substring(0, 1).match(regex)) {
      const exp = parse(segments.slice(i, segments.length - 1).join(' '));
      const { scope } = analyze(exp);
      [...scope.references].forEach((ref) =>
        this.keys.push({ name: ref, variableRef: `${this.iterable}.${ref}` }),
      );
    } else {
      const str = segments[i + 1].replace(regex, '');
      this.keys.push({ name: str, variableRef: str });
    }
  }

  render_each_block(): Node {
    return x`
      export function ${this.identifier}() {
        return {
          c() {}
          m() {}
          u() {}
        }
      }
    `;
  }
}
