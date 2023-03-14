import {
  fetch_object,
  generate_attr_str,
  generate_node_str,
  generate_toggle_class_str,
  is_reference,
  parse,
  render_ref_check,
} from '../utils';
import { Node } from 'estree';
import {
  Binding,
  CompilerParams,
  Props,
  ReactiveStatement,
  Reference,
} from '../interfaces';
import Component from './Component';
import { analyze, extract_names } from 'periscopic';
import { walk } from 'estree-walker';
import { print, x, b } from 'code-red';
import BlockComponent from './Block';
import EachBlockComponent from './EachBlock';

export default class Fragment extends Component {
  reactives: ReactiveStatement[];
  residuals: Node[];
  props: Props;
  ast: Node[];

  constructor(parsed: CompilerParams) {
    super(parsed);
    this.root_entities = parsed.nodes.filter((node) => !node.parent);
    this.child_entities = parsed.nodes.filter((node) => node.parent);
    this.reactives = parsed.reactives || [];
    this.residuals = parsed.residuals || [];
    this.props = parsed.props || {};
    this.ast = [];
    this.populate_deps(this.bindings);
    this.populate_deps(this.references);
    this.populate_deps(this.class_references);
  }

  invalidate_residuals(ast: Node): void {
    const props: string[] = Object.keys(this.props);
    walk(ast, {
      enter(node: any) {
        let mutated: string[];
        if (node.type === 'AssignmentExpression') {
          mutated = extract_names(fetch_object(node.left));
        } else if (node.type === 'UpdateExpression') {
          mutated = extract_names(fetch_object(node.argument));
        }

        if (mutated && mutated.some((m) => props.indexOf(m) > -1)) {
          this.replace(
            x`$$invalidate($$dirty, [${mutated
              .map((m) => props.indexOf(m))
              .join(',')}], (${print(node).code}), app.p)`,
          );
        }
      },
    });
  }

  filter_reactive_deps() {
    this.reactives.forEach((r) => {
      r.deps = r.deps.filter((d) => Object.keys(this.props).includes(d));
    });
  }

  render_fragment(blocks: BlockComponent[]): Node[] {
    this.invalidate_residuals(this.residuals as any as Node);
    this.filter_reactive_deps();
    this.ast = b`


    function create_fragment() {

      let ${this.identifiers
        .concat(
          this.identifiers
            .filter((i) => i.indexOf('B') > -1)
            .map((x) => `${x}_value`),
        )
        .join(',')}

      ${blocks
        .filter((block) => block.type === 'each')
        .map(
          (block: EachBlockComponent) =>
            b`let ${block.vars.block_arr_name} = []`,
        )}
          
      ${blocks
        .filter((block) => block.type === 'each')
        .map((block: EachBlockComponent) =>
          block.render_each_for(true, block.render_each_populate()),
        )}

        let mountPoint;
            
        return {
          c() {
            ${this.all_entities.map((node) =>
              generate_node_str(this.identifiers, node),
            )}
            ${this.all_entities
              .map((node) => generate_attr_str(this.identifiers, node))
              .filter((list) => list.length)}

  
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) =>
                block.render_each_for(true, block.render_each_create()),
              )}
  
            ${this.listeners.map(
              (listener) =>
                x`${this.identifiers[listener.index]}.addEventListener("${
                  listener.event
                }", ${listener.handler})`,
            )}

            ${this.class_references.map((r) =>
              generate_toggle_class_str(this.identifiers, r),
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
                    `(${this.identifiers[r.index]})`
                  }})`;
                });
              })}
          },
          m(target) {
            mountPoint = target;
            ${this.child_entities.map(
              (node) =>
                x`${this.identifiers[node.parent!.index]}.appendChild(${
                  this.identifiers[node.index]
                })`,
            )}
  
            ${this.root_entities.map(
              (node) => x`target.append(${this.identifiers[node.index]})`,
            )}
  
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) =>
                block.render_each_for(
                  true,
                  block.render_each_mount(this.all_entities, this.identifiers),
                ),
              )}

            ${this.references.map(
              (r) => x`${this.identifiers[r.index]}.${r.var} = ${r.ref}`,
            )}

          },
          p() {
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) => {
                return b`
                if (${this.dirty(
                  block.vars.unique_deps,
                  Object.keys(this.props),
                )}) {
                  ${block.render_each_for(
                    true,
                    block.render_each_update(
                      this.all_entities,
                      this.identifiers,
                    ),
                  )}
                  ${block.render_each_for(false, block.render_each_detach())}
                  ${block.vars.block_arr_name}.length = ${block.iterable}.length
                }
                `;
              })}
            ${this.bindings.map(
              (binding) =>
                b`if (${this.dirty(binding.deps, Object.keys(this.props))} && ${
                  this.identifiers[binding.index] + '_value'
                } !== (${this.identifiers[binding.index] + '_value'} = (${
                  binding.data
                }) + '')) $$set_data(${this.identifiers[binding.index]},${
                  this.identifiers[binding.index] + '_value'
                })`,
            )}

            ${this.references.map((r) =>
              render_ref_check(
                this.dirty(r.deps, Object.keys(this.props)),
                this.identifiers,
                r,
              ),
            )}

            ${this.class_references.map(
              (r) => b`
              if (${this.dirty(
                r.deps,
                Object.keys(this.props),
              )}) ${generate_toggle_class_str(this.identifiers, r)}
            `,
            )}

            ${this.reactives.map(
              (r) =>
                b`if (${this.dirty(r.deps, Object.keys(this.props))}) { ${
                  r.chunk
                } }`,
            )}

            $$dirty.fill(-1)
          }
        }
      }`;
    return this.ast;
  }

  render_handler_func(
    identifier: string,
    ref: Reference,
    event: string[],
  ): Node[] {
    let exps: Node[] = [];
    event.forEach((e) => {
      let func = `${identifier}_handler_${e}`;
      exps.push(x`
      function ${func}(el) {
        ${ref.ref} = el.${ref.var};
        $$invalidate($$dirty, [${ref.deps
          .map((d) => Object.keys(this.props).indexOf(d))
          .join(',')}], (${ref.ref}), app.p);
      }
      `);
    });
    return exps;
  }

  populate_deps(bindings: Binding[] | Reference[]): void {
    bindings.forEach((binding) => {
      binding.deps = [];
      const expression: Node = is_reference(binding)
        ? parse(binding.ref)
        : parse(binding.data);
      const { scope } = analyze(expression);
      [...scope.references].forEach((ref) => binding.deps.push(ref));
    });
  }
}
