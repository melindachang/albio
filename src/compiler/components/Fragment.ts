import { fetchObject, generateAttrStr, generateNodeStr, parse } from '../utils';
import { Node, Statement } from 'estree';
import { Binding, CompilerParams, Props } from '../interfaces';
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
  ctx: any[];

  constructor(parsed: CompilerParams) {
    super(parsed);
    this.rootEntities = parsed.nodes.filter((node) => !node.parent);
    this.childEntities = parsed.nodes.filter((node) => node.parent);
    this.residuals = parsed.reactives || [];
    this.residuals = parsed.residuals || [];
    this.props = parsed.props || {};
    this.ast = [];
    this.populateDeps(this.bindings);
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
            x`$$invalidate($$dirty, '${mutated.join(',')}', (${print(node).code}), app.p)`,
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
        .map((block: EachBlockComponent) => `let ${block.vars.block_arr_name} = []`)
        .join('\n')}
          
      ${blocks
        .filter((block) => block.type === 'each')
        .map((block: EachBlockComponent) => block.render_each_for(block.render_each_populate()))}

        let mountPoint;
            
        return {
          c() {
            ${this.allEntities.map((node) => generateNodeStr(this.identifiers, node))}
            ${this.allEntities
              .map((node) => generateAttrStr(this.identifiers, node))
              .filter((list) => list.length > 0)}
  
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) =>
                block.render_each_for(block.render_each_create()),
              )}
  
            ${this.listeners.map(
              (listener) =>
                x`${this.identifiers[listener.index]}.addEventListener("${listener.event}", ${
                  listener.handler
                })`,
            )}
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
                block.render_each_for(block.render_each_mount(this.allEntities, this.identifiers)),
              )}
          },
          p() {
            ${blocks
              .filter((block) => block.type === 'each')
              .map((block: EachBlockComponent) =>
                block.render_each_for(block.render_each_update(this.allEntities, this.identifiers)),
              )}
            ${this.bindings.map(
              (binding) =>
                b`if ($$checkDirtyDeps($$dirty, [${binding.deps
                  .map((dep) => `\"${dep}\"`)
                  .join(',')}]) && ${this.identifiers[binding.index] + '_value'} !== (${
                  this.identifiers[binding.index] + '_value'
                } = eval("${binding.data}") + '')) $$setData(${this.identifiers[binding.index]},${
                  this.identifiers[binding.index] + '_value'
                })`,
            )}
            $$dirty.clear()
          }
        }
      }`;
    return this.ast;
  }

  populateDeps(bindings: Binding[]): void {
    bindings.forEach((binding) => {
      binding.deps = [];
      const expression: Node = parse(binding.data);
      const { scope } = analyze(expression);
      [...scope.references].forEach((ref) => binding.deps.push(ref));
    });
  }
}
