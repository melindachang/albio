import { destringify, fetchObject, generateAttrStr, generateNodeStr, parse } from '../utils';
import util from 'util';
import { Node, Statement } from 'estree';
import { Binding, CompilerParams, Props } from '../interfaces';
import Component from './Component';
import { analyze, extract_names } from 'periscopic';
import { walk } from 'estree-walker';
import { b, print, x } from 'code-red';

export default class Fragment extends Component {
  reactives: Statement[];
  residuals: Node[];
  blocks: Component[];
  props: Props;
  ast: Node[];

  constructor(parsed: CompilerParams) {
    super(parsed);
    ``;
    this.rootEntities = parsed.nodes.filter((node) => !node.parent);
    this.childEntities = parsed.nodes.filter((node) => node.parent);
    this.residuals = parsed.reactives || [];
    this.residuals = parsed.residuals || [];
    this.blocks = parsed.blocks || [];
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

  generate(): Node[] {
    this.invalidateResiduals(this.residuals as any as Node);
    this.ast = b`
    import { $$invalidate, $$element, $$setData, $$text, $$checkDirtyDeps } from '/assets/albio_internal.js';

      function create_fragment() {
      let ${this.identifiers
        .concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`))
        .join(',')}
     return { c() {
        ${this.allEntities.map((node) => generateNodeStr(this.identifiers, node)).join('\n')}
        ${this.allEntities
          .map((node) => generateAttrStr(this.identifiers, node))
          .filter((list) => list.length > 0)
          .join('\n')}
        ${this.listeners
          .map(
            (listener) =>
              `${this.identifiers[listener.index]}.addEventListener("${listener.event}", ${
                listener.handler
              })`,
          )
          .join('\n')}
      },
      m(target) {
        ${this.childEntities
          .map(
            (node) =>
              `${this.identifiers[node.parent!.index]}.appendChild(${
                this.identifiers[node.index]
              })`,
          )
          .join('\n')}
        ${this.rootEntities
          .map((node) => `target.append(${this.identifiers[node.index]})`)
          .join('\n')}
      },
      p() {
        ${this.bindings
          .map(
            (b) =>
              `if ($$checkDirtyDeps($$dirty, [${b.deps.map((d) => `\"${d}\"`)}]) && ${
                this.identifiers[b.index]
              }_value !== (${this.identifiers[b.index]}_value = eval("${b.data.replace(
                /(^|[^\\])"/g,
                '$1\\"',
              )}") + '')) $$setData(${this.identifiers[b.index]},${
                this.identifiers[b.index]
              }_value)`,
          )
          .join('\n')}
        $$dirty = []
      }
    }
    }
    export const app = create_fragment();
    
    let {${Object.keys(this.props).join(',')}} = ${util.inspect(
      Object.fromEntries(Object.entries(this.props).map(([k, v]) => [k, destringify(v)])),
    )}
  
        let $$dirty = []
  
        ${this.residuals}
    `;

    return this.ast;
  }

  astToString(): string {
    return print(this.ast as any as Node).code;
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
