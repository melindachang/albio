import {
  ASTNode,
  Binding,
  EachBlock,
  IterableKey,
  Props,
  Reference,
} from '../interfaces';
import {
  generate_attr_str,
  generate_node_str,
  generate_toggle_class_str,
  is_reference,
  parse,
  render_ref_check,
} from '../utils';
import { b, x } from 'code-red';
import { Node } from 'estree';
import BlockComponent from './Block';
import { walk } from 'estree-walker';
import { analyze } from 'periscopic';

export default class EachBlockComponent extends BlockComponent {
  tag: string;
  iterable: string;
  keys: IterableKey[] = [];
  vars: {
    block_arr_name: string;
    create_func_name: string;
    unique_deps: string[];
  };

  constructor(block: EachBlock) {
    super(block);
    const segments = (this.start_node as Binding).data.split(' ');
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
    this.populate_deps(this.bindings, this.keys, this.iterable);
    this.populate_deps(this.references, this.keys, this.iterable);
    this.populate_deps(this.class_references, this.keys, this.iterable);
    const all_deps: string[] = [];
    this.bindings
      .map((binding) => binding.deps)
      .forEach((deps) => all_deps.push(...deps));
    this.vars = {
      block_arr_name: `each_block_${this.index}`,
      create_func_name: `create_each_block_${this.index}`,
      unique_deps: [...new Set(all_deps)],
    };
  }
  render_each_for(reset: boolean, node: Node | Node[]): Node[] {
    const dec = reset ? b`let #i` : ``;
    const dec2 = reset ? x`#i = 0` : ``;
    const operableLength = reset
      ? x`${this.iterable}.length`
      : x`${this.vars.block_arr_name}.length`;
    return b`
      ${dec}
      for (${dec2}; #i < ${operableLength}; #i += 1) {
        ${node}
      }
    `;
  }

  render_handler_func(
    identifier: string,
    ref: Reference,
    event: string[],
    props: Props,
  ): Node[] {
    let exps: Node[] = [];
    event.forEach((e) => {
      let func = `${identifier}_handler_${e}`;
      let property;
      const ast = parse(ref.ref);
      walk(ast, {
        enter(node) {
          if (node.type === 'MemberExpression')
            property = (node as any).property.name;
        },
      });
      /** TODO: Doesn't work with property literals */
      exps.push(x`
      function ${func}(each_value, i) {
        ${property ? `each_value[i].${property}` : 'each_value[i]'} = this.${
        ref.var
      };
        $$invalidate($$dirty, [${ref.deps
          .map((d) => Object.keys(props).indexOf(d))
          .join(',')}], (each_value), app.p);
      }
      `);
    });
    return exps;
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
      this.start_node.parent
        ? identifiers[this.start_node.parent.index]
        : 'mountPoint'
    }, ${
      nodes.some((node) => this.end_node.endIndex === node.startIndex)
        ? identifiers[
            nodes.find((node) => this.end_node.endIndex === node.startIndex)
              .index
          ]
        : 'null'
    })`;
  }

  render_each_update(nodes: ASTNode[], identifiers: string[]): Node[] {
    return b`
      if (${this.vars.block_arr_name}[#i]) {
        ${this.vars.block_arr_name}[#i].p(#i)
      } else {
        ${this.render_each_populate()}
        ${this.render_each_create()}
        ${this.render_each_mount(nodes, identifiers)}
      }
    `;
  }

  render_each_detach() {
    return x`${this.vars.block_arr_name}[#i].d(1)`;
  }

  render_each_current(index?: string): Node {
    return x`
    ${this.keys
      .map(
        (key) =>
          `${key.name} = ${this.iterable}[${index ? index : 'i'}]${
            key.name === key.variableRef ? '' : '.' + key.name
          }`,
      )
      .join(',')}`;
  }

  render(props: string[]): Node {
    return x`
      function ${this.vars.create_func_name}(i) {
        let ${this.render_each_current()}

         let ${this.identifiers
           .concat(
             this.identifiers
               .filter((i) => i.indexOf('B') > -1)
               .map((x) => `${x}_value`),
           )
           .join(',')}

        return {
          c() {
            ${this.all_entities.map((node) =>
              generate_node_str(this.identifiers, node),
            )}

            ${this.all_entities
              .map((node) => generate_attr_str(this.identifiers, node))
              .filter((list) => list.length > 0)}

            ${this.listeners.map(
              (listener) =>
                x`${this.identifiers[listener.index]}.addEventListener("${
                  listener.event
                }", ${listener.handler})`,
            )}
            
            ${this.references
              .filter((r) => r.assoc_events)
              .map((r) => {
                return r.assoc_events.map((e) => {
                  return x`${
                    this.identifiers[r.index]
                  }.addEventListener("${e}", () => { ${
                    this.identifiers[r.index] +
                    '_handler_' +
                    e +
                    `.call(${this.identifiers[r.index]}, ${this.iterable}, i)`
                  }})`;
                });
              })}

              
            ${this.class_references.map((r) =>
              generate_toggle_class_str(this.identifiers, r),
            )}


          },
          m(target, anchor) {
            ${this.root_entities.map(
              (node) =>
                x`target.insertBefore(${
                  this.identifiers[node.index]
                }, anchor || null)`,
            )}

            ${this.child_entities.map(
              (node) =>
                x`${this.identifiers[node.parent!.index]}.appendChild(${
                  this.identifiers[node.index]
                })`,
            )}
            
            ${this.references.map(
              (r) => x`${this.identifiers[r.index]}.${r.var} = ${r.ref}`,
            )}
              
          },
          p(new_index) {
            ${this.render_each_current('new_index')}

            ${this.bindings.map(
              (binding) =>
                b`if (${this.dirty(binding.deps, props)} && ${
                  this.identifiers[binding.index] + '_value'
                } !== (${this.identifiers[binding.index] + '_value'} = (${
                  binding.data
                }) + '')) $$set_data(${this.identifiers[binding.index]},${
                  this.identifiers[binding.index] + '_value'
                })`,
            )}

            ${this.references.map((r) =>
              render_ref_check(this.dirty(r.deps, props), this.identifiers, r),
            )}
            
            ${this.class_references.map(
              (r) => b`
              if (${this.dirty(r.deps, props)}) ${generate_toggle_class_str(
                this.identifiers,
                r,
              )}
            `,
            )}

          },
          d(detaching) {
            ${this.root_entities.map(
              (node) =>
                b`if (detaching) $$detach(${this.identifiers[node.index]})`,
            )}
          }
        }
      }
    `;
  }

  populate_deps(
    bindings: Binding[] | Reference[],
    keys: IterableKey[],
    iterable: string,
  ): void {
    bindings.forEach((binding) => {
      let deps: Set<string> = new Set();
      const expression: Node = is_reference(binding)
        ? parse(binding.ref)
        : parse(binding.data);
      const { scope } = analyze(expression);
      [...scope.references].forEach((ref) => {
        keys.map((key) => key.name).includes(ref)
          ? deps.add(iterable)
          : deps.add(ref);
      });
      binding.deps = [...deps];
    });
  }
}
