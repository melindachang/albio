import {
  fetchObject,
  generateAttrStr,
  generateNodeStr,
  generateToggleClassStr,
  isReference,
  parse,
  render_ref_check,
} from '../utils';
import { Node, Statement } from 'estree';
import { Binding, CompilerParams, Props, Reference } from '../interfaces';
import Component from './Component';
import { analyze, extract_names } from 'periscopic';
import { walk } from 'estree-walker';
import { print, x, b } from 'code-red';
import BlockComponent from './Block';
import EachBlockComponent from './EachBlock';

export default class Fragment extends Component {
  reactives: Statement[];
  residuals: Node[];
  props: Props;
  ast: Node[];

  constructor(parsed: CompilerParams) {
    super(parsed);
    this.rootEntities = parsed.nodes.filter((node) => !node.parent);
    this.childEntities = parsed.nodes.filter((node) => node.parent);
    this.residuals = parsed.reactives || [];
    this.residuals = parsed.residuals || [];
    this.props = parsed.props || {};
    this.ast = [];
    this.populateDeps(this.bindings);
    this.populateDeps(this.references);
    this.populateDeps(this.classReferences);
  }

  invalidateResiduals(ast: Node): void {
    const props: string[] = Object.keys(this.props);
    walk(ast, {
      enter(node: any) {
        let mutated: string[];
        if (node.type === 'AssignmentExpression') {
          mutated = extract_names(fetchObject(node.left));
        } else if (node.type === 'UpdateExpression') {
          mutated = extract_names(fetchObject(node.argument));
        }

        if (mutated && mutated.some((m) => props.indexOf(m) > -1)) {
          this.replace(
            x`$$invalidate($$dirty, [${mutated.map((m) => props.indexOf(m)).join(',')}], (${
              print(node).code
            }), app.p)`,
          );
        }
      },
    });
  }

  render_fragment(blocks: BlockComponent[]): Node[] {
    this.invalidateResiduals(this.residuals as any as Node);
    this.ast = b`


    function create_fragment() {

      let ${this.identifiers
        .concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`))
        .join(',')}

      ${blocks
        .filter((block) => block.type === 'each')
        .map(
          (block: EachBlockComponent) => b`
            let ${block.vars.block_arr_name} = []
        `,
        )}
          
      ${blocks
        .filter((block) => block.type === 'each')
        .map((block: EachBlockComponent) =>
          block.render_each_for(true, block.render_each_populate()),
        )}

        let mountPoint;
            
        return {
          c() {
            ${this.allEntities.map((node) => generateNodeStr(this.identifiers, node))}
            ${this.allEntities
              .map((node) => generateAttrStr(this.identifiers, node))
              .filter((list) => list.length)}

  
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) =>
                block.render_each_for(true, block.render_each_create()),
              )}
  
            ${this.listeners.map(
              (listener) =>
                x`${this.identifiers[listener.index]}.addEventListener("${listener.event}", ${
                  listener.handler
                })`,
            )}

            ${this.classReferences.map((r) => generateToggleClassStr(this.identifiers, r))}
            ${this.references
              .filter((r) => r.assoc_events)
              .map((r) => {
                return r.assoc_events.map((e) => {
                  return x`${this.identifiers[r.index]}.addEventListener("${e}", () => { ${
                    this.identifiers[r.index] + '_handler_' + e + `(${this.identifiers[r.index]})`
                  }})`;
                });
              })}
          },
          m(target) {
            mountPoint = target;
            ${this.childEntities.map(
              (node) =>
                x`${this.identifiers[node.parent!.index]}.appendChild(${
                  this.identifiers[node.index]
                })`,
            )}
  
            ${this.rootEntities.map((node) => x`target.append(${this.identifiers[node.index]})`)}
  
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) =>
                block.render_each_for(
                  true,
                  block.render_each_mount(this.allEntities, this.identifiers),
                ),
              )}

            ${this.references.map((r) => x`${this.identifiers[r.index]}.${r.var} = ${r.ref}`)}

          },
          p() {
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) => {
                return b`
                if (${this.dirty(block.vars.unique_deps, Object.keys(this.props))}) {
                  ${block.render_each_for(
                    true,
                    block.render_each_update(this.allEntities, this.identifiers),
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
              render_ref_check(this.dirty(r.deps, Object.keys(this.props)), this.identifiers, r),
            )}

            ${this.classReferences.map(
              (r) => b`
              if (${this.dirty(r.deps, Object.keys(this.props))}) ${generateToggleClassStr(
                this.identifiers,
                r,
              )}
            `,
            )}

            $$dirty.fill(-1)
          }
        }
      }`;
    return this.ast;
  }

  render_handler_func(identifier: string, ref: Reference, event: string[]): Node[] {
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

  populateDeps(bindings: Binding[] | Reference[]): void {
    bindings.forEach((binding) => {
      binding.deps = [];
      const expression: Node = isReference(binding) ? parse(binding.ref) : parse(binding.data);
      const { scope } = analyze(expression);
      [...scope.references].forEach((ref) => binding.deps.push(ref));
    });
  }
}
