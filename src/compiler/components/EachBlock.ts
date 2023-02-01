import { Binding, EachBlock } from '../interfaces';
import { createUniqueName, generateAttrStr, generateNodeStr, parse } from '../utils';
import { analyze } from 'periscopic';
import { x } from 'code-red';
import { Node } from 'estree';
import BlockComponent from './Block';

interface IterableKey {
  name: string;
  variableRef: string;
}

export default class EachBlockComponent extends BlockComponent {
  tag: string;
  iterable: string;
  keys: IterableKey[] = [];

  constructor(block: EachBlock) {
    super(block, 'E');
    this.tag = createUniqueName();
    const segments = (this.startNode as Binding).data.split(' ');
    this.iterable = segments[1];

    const regex = /[^\w.-]+/g;
    const i = segments.indexOf('as');
    if (segments[i + 1].substring(0, 1).match(regex)) {
      const rest = segments.slice(i + 1, segments.length).join(' ');
      const exp = parse(rest.substring(0, rest.search('}') + 1));
      const { scope } = analyze(exp);
      [...scope.references].forEach((ref) =>
        this.keys.push({ name: ref, variableRef: `${this.iterable}.${ref}` }),
      );
    } else {
      const str = segments[i + 1].replace(regex, '');
      this.keys.push({ name: str, variableRef: str });
    }
  }

  // FINISH: each iteration is its own component with its own lifecycle stored inside create_each_block 

  render_each_block(): Node {
    return x`
      function create_each_block_${this.tag}(dep) {
        
        let iters = []

        function register_node() {
          let ${this.identifiers.join(',')}

        }

        for (let #i = 0; #i < Object.keys(dep).length; #i++) iters[i] = register_node();

        return {
          c() {
          },
          m() {
          },
          u() {}
        }
      }
    `;
  }
}
