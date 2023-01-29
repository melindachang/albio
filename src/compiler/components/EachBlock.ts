import { Binding, EachBlock } from '../interfaces';
import Component from './Component';
import { createUniqueName, generateAttrStr, generateNodeStr, parse } from '../utils';
import { analyze } from 'periscopic';
import { x } from 'code-red';
import { Node } from 'estree';

interface IterableKey {
  name: string;
  variableRef: string;
}

export default class EachBlockComponent extends Component {
  tag: string;
  iterable: string;
  keys: IterableKey[] = [];

  constructor(block: EachBlock) {
    super(block, 'E');
    this.tag = createUniqueName();
    const segments = (this.startNode as Binding).data.split(' ');
    this.iterable = segments[1];
    console.log(segments);

    const regex = /[^\w.-]+/g;
    const i = segments.indexOf('as');
    if (segments[i + 1].substring(0, 1).match(regex)) {
      const exp = parse(segments.slice(i + 1, segments.length - 1).join(' '));
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
      function create_each_block_${this.tag}() {
        
        let ${this.identifiers.join(',')}
        return {
          c() {
            ${this.allEntities.map((node) => generateNodeStr(this.identifiers, node)).join('\n')}
            ${this.allEntities
              .map((node) => generateAttrStr(this.identifiers, node))
              .filter((list) => list.length > 0)
              .join('\n')}
            ${this.listeners
              .map(
                (l) => `${this.identifiers[l.index]}.addEventListener("${l.event}", ${l.handler})`,
              )
              .join('\n')}

          },
          m() {
            for (let #i = 0; #i < Object.keys(${this.iterable}).length; #i++) {
              
            }
          },
          u() {}
        }
      }
    `;
  }
}
