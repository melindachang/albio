import { ASTNode, Binding, EachBlock, IterableKey, Props } from '../interfaces';
import { generateAttrStr, generateNodeStr, parse } from '../utils';
import { b, x } from 'code-red';
import { Node } from 'estree';
import BlockComponent from './Block';
import { analyze } from 'periscopic';

export default class EachBlockComponent extends BlockComponent {
  tag: string;
  iterable: string;
  keys: IterableKey[] = [];
  vars: {
    block_arr_name: string;
    create_func_name: string;
    block_arr_length: string;
    unique_deps: string[];
  };

  constructor(block: EachBlock) {
    super(block);
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
    this.populateDeps(this.bindings, this.keys, this.iterable);
    const all_deps: string[] = [];
    this.bindings.map((binding) => binding.deps).forEach((deps) => all_deps.push(...deps));
    this.vars = {
      block_arr_name: `each_blocks_${this.index}`,
      create_func_name: `create_each_block_${this.index}`,
      block_arr_length: `each_block_${this.index}_length`,
      unique_deps: [...new Set(all_deps)],
    };
  }

  render_each_for(reset: boolean, node: Node | Node[]): Node[] {
    const dec = reset ? b`let #i` : ``;
    const dec2 = reset ? x`#i = 0` : ``;
    const operableLength = reset
      ? x`${this.iterable}.length`
      : x`${this.vars.block_arr_length}`;
    return b`
      ${dec}
      for (${dec2}; #i < ${operableLength}; #i += 1) {
        ${node}
      }
    `;
  }

  render_each_populate(): Node {
    return x`${this.vars.block_arr_name}[#i] = ${this.vars.create_func_name}(#i)`;
  }

  render_each_create(): Node {
    return x`${this.vars.block_arr_name}[#i].c()`;
  }

  render_each_mount(nodes: ASTNode[], identifiers: string[]): Node {
    return x`
    ${this.vars.block_arr_name}[#i].m(${
      this.startNode.parent ? identifiers[this.startNode.parent.index] : 'mountPoint'
    }, ${
      nodes.some((node) => this.endNode.endIndex === node.startIndex)
        ? identifiers[nodes.find((node) => this.endNode.endIndex === node.startIndex).index]
        : 'null'
    })`;
  }

  render_each_update(nodes: ASTNode[], identifiers: string[]): Node[] {
    return b`
      if (${this.vars.block_arr_name}[#i]) {
        ${this.vars.block_arr_name}[#i].p(dirty)
      } else {
        ${this.render_each_populate()}
        ${this.render_each_create()}
        ${this.render_each_mount(nodes, identifiers)}
      }
    `;
  }

  render_each_detach() {
    return x`${this.vars.block_arr_name}[#i].d()`;
  }

  render_each_current(): Node {
    return x`
    ${this.keys
      .map(
        (key) =>
          `${key.name} = ${this.iterable}[i]${key.name === key.variableRef ? '' : '.' + key.name}`,
      )
      .join(',')}`;
  }

  render(props: string[]): Node {
    return x`
      function ${this.vars.create_func_name}(i) {
        let ${this.render_each_current()}

         let ${this.identifiers
           .concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`))
           .join(',')}

        return {
          c() {
            ${this.allEntities.map((node) => generateNodeStr(this.identifiers, node))}

            ${this.allEntities
              .map((node) => generateAttrStr(this.identifiers, node))
              .filter((list) => list.length > 0)}

            ${this.listeners.map(
              (listener) =>
                `${this.identifiers[listener.index]}.addEventListener("${listener.event}", ${
                  listener.handler
                })`,
            )}
          },
          m(target, anchor) {
            ${this.rootEntities.map(
              (node) => x`target.insertBefore(${this.identifiers[node.index]}, anchor || null)`,
            )}

            ${this.childEntities.map(
              (node) =>
                x`${this.identifiers[node.parent!.index]}.appendChild(${
                  this.identifiers[node.index]
                })`,
            )}
              
          },
          p(dirty) {
            ${this.render_each_current()}

            ${this.bindings.map(
              (binding) =>
                b`if (${this.dirty(binding.deps, props)} && ${
                  this.identifiers[binding.index] + '_value'
                } !== (${this.identifiers[binding.index] + '_value'} = (${
                  binding.data
                }) + '')) $$setData(${this.identifiers[binding.index]},${
                  this.identifiers[binding.index] + '_value'
                })`,
            )}
          },
          d() {
            ${this.rootEntities.map(
              (node) =>
                x`${this.identifiers[node.index]}.parentNode.removeChild(${
                  this.identifiers[node.index]
                })`,
            )}
          }
        }
      }
    `;
  }

  populateDeps(bindings: Binding[], keys: IterableKey[], iterable: string): void {
    bindings.forEach((binding) => {
      let deps: Set<string> = new Set();
      const expression: Node = parse(binding.data);
      const { scope } = analyze(expression);
      [...scope.references].forEach((ref) => {
        keys.map((key) => key.name).includes(ref) ? deps.add(iterable) : deps.add(ref);
      });
      binding.deps = [...deps];
    });
  }
}
