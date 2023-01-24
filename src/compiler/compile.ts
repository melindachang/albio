import { type ASTNode, Binding, Listener, ElementTag, TextTag, Props } from './interfaces';
import { Node, Statement } from 'estree';
import { b, x, print, parse } from 'code-red';
import util from 'util';
import { walk } from 'estree-walker';
import { analyze, extract_names } from 'periscopic';
import { destringify, fetchObject } from './utils';

interface CompilerParams {
  nodes: ASTNode[];
  listeners: Listener[];
  props?: Props;
  reactives?: Statement[];
  residuals?: Node[];
}

export default class Compiler {
  allEntities: ASTNode[];
  rootEntities: ASTNode[];
  childEntities: ASTNode[];

  identifiers: string[];
  bindings: Binding[];
  reactives: Statement[];
  props: Props;
  listeners: Listener[];
  residuals: Node[];

  ast: Node[];

  constructor(parsed: CompilerParams) {
    this.allEntities = parsed.nodes;
    this.rootEntities = parsed.nodes.filter((node) => node.parent === undefined);
    this.childEntities = parsed.nodes.filter((node) => node.parent !== undefined);

    this.identifiers = parsed.nodes.map((node) => [node.type[0], node.index].join(''));
    this.bindings = parsed.nodes.filter((node) => node.type === 'Binding') as Binding[];
    this.reactives = parsed.reactives ? parsed.reactives : [];
    this.props = parsed.props ? parsed.props : {};
    this.listeners = parsed.listeners;
    this.residuals = parsed.residuals ? parsed.residuals : [];

    this.ast = [];

    this.populateDeps(this.bindings);
  }

  invalidateResiduals(ast: Node): void {
    walk(ast, {
      enter(node: any) {
        let mutated: string[];
        if (node.type === 'AssignmentExpression') {
          mutated = extract_names(fetchObject(node.left));
        } else if (node.type === 'UpdateExpression') {
          mutated = extract_names(fetchObject(node.argument));
        }

        if (mutated) {
          this.replace(
            x`$$invalidate($$dirty, '${mutated.join(',')}', (${
              print(node).code
            }), updateComponent)`,
          );
        }
      },
    });
  }

  generate(): Node[] {
    this.invalidateResiduals(this.residuals as any as Node);
    this.ast = b`
    import { $$invalidate, $$setData, $$text, $$checkDirtyDeps } from '/assets/albio_internal.js';
      let {${Object.keys(this.props).join(',')}} = ${util.inspect(
      Object.fromEntries(Object.entries(this.props).map(([k, v]) => [k, destringify(v)])),
    )}
      let $$dirty = []
      ${this.residuals}
      let ${this.identifiers
        .concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`))
        .join(',')}
     export function registerComponent() {
        ${this.allEntities.map((node) => this.generateNodeStr(this.identifiers, node)).join('\n')}
        ${this.allEntities
          .map((node) => this.generateAttrStr(this.identifiers, node))
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
      }
      export function mountComponent(target) {
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
      }
      export function updateComponent() {
        let $$deps
        ${this.bindings
          .map(
            (b) =>
              `$$deps = [${b.deps.map(
                (d) => `\"${d}\"`,
              )}]\nif ($$checkDirtyDeps($$dirty, $$deps) && ${
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
    `;
    return this.ast;
  }

  astToString(): string {
    return print(this.ast as any as Node).code;
  }

  generateNodeStr(identifiers: string[], node: ASTNode): string {
    const identifier = identifiers[node.index];
    switch (node.type) {
      case 'Text':
        return `${identifier} = $$text("${(node as TextTag).value.replace(/\n/g, '\\n')}")`;
      case 'Binding':
        return `${identifier}_value = $$text(${
          (node as Binding).data
        })\n${identifier} = $$text(${identifier}_value.data)`;
      default:
        return `${identifier} = document.createElement("${node.name}")`;
    }
  }

  generateAttrStr(identifiers: string[], node: ASTNode): string[] {
    if (!(node as ElementTag).attrs) return [];
    const identifier = identifiers[node.index];
    return Object.entries((node as ElementTag).attrs!).map(
      ([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`,
    );
  }

  populateDeps(bindings: Binding[]): void {
    bindings.forEach((binding) => {
      binding.deps = [];
      const expression: Node = parse(binding.data, {
        sourceType: 'module',
        ecmaVersion: 12,
        locations: true,
      });
      const { scope } = analyze(expression);
      [...scope.references].forEach((ref) => binding.deps.push(ref));
    });
  }
}
