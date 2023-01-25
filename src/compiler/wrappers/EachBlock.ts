import { Text } from 'domhandler';
import { EachBlock } from '../interfaces';
import Wrapper from './Wrapper';
import { parse } from '../utils';
import { analyze } from 'periscopic';

interface IterableKey {
  name: string;
  variableRef: string;
}

export default class EachBlockWrapper extends Wrapper {
  iterable: string;
  keys: IterableKey[];

  constructor(block: EachBlock) {
    super(block);
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

  pruneVariableName(name: string): string {
    return name.replace(/[^\w.-]+/g, '');
  }
}
