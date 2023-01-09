import { type ASTNode, Binding, Listener, ElementTag, TextTag, Props } from './interfaces';
import { Identifier, Node, Statement } from 'estree';
import { b, x, print } from 'code-red';
import jsep from 'jsep';
import util from 'util';
import { walk } from 'estree-walker';

export default class Renderer {
  allEntities: ASTNode[];
  rootEntities: ASTNode[];
  childEntities: ASTNode[];

  identifiers: string[];
  bindings: Binding[];
  reactiveBlocks: Statement[];
  props: Props;
  listeners: Listener[];
  residualNodes: Node[];

  ast: Node[];

  constructor(
    nodes: ASTNode[],
    props: Props,
    reactiveBlocks: Statement[],
    listeners: Listener[],
    residualNodes: Node[],
  ) {
    this.allEntities = nodes;
    this.rootEntities = nodes.filter((node) => node.parent === undefined);
    this.childEntities = nodes.filter((node) => node.parent !== undefined);

    this.identifiers = nodes.map((node) => [node.type[0], node.index].join(''));
    this.bindings = nodes.filter((node) => node.type === 'Binding') as Binding[];
    this.reactiveBlocks = reactiveBlocks;
    this.props = props;
    this.listeners = listeners;
    this.residualNodes = residualNodes;

    this.ast = [];

    this.populateDeps(this.bindings);
    this.invalidateResiduals(this.residualNodes as any as Node);
  }

  // TODO messy

  invalidateResiduals(ast: Node): void {
    walk(ast, {
      enter(node: any) {
        if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
          this.replace(x`$$invalidate($$dirty, ${print(x`${node}`).code}, updateComponent)`);
        }
      },
    });
  }

  generate(): Node[] {
    this.ast = b`
      import { $$invalidate, set_data, text, check_dirty_deps } from 'albio/internals';

        let {${Object.keys(this.props).join(',')}} = ${util.inspect(
      Object.fromEntries(Object.entries(this.props).map(([k, v]) => [k, this.destringify(v)])),
    )}
        let $$dirty = null

        ${this.residualNodes}

        let ${this.identifiers
          .concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`))
          .join(',')}

         export function registerComponent() {
            ${this.allEntities
              .map((node) => this.generateNodeStr(this.identifiers, node))
              .join('\n')}
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
                  )}]\nif (check_dirty_deps($$dirty, $$deps) && ${
                    this.identifiers[b.index]
                  }_value !== (${this.identifiers[b.index]}_value = eval(${
                    b.data
                  }) + '')) set_data(${this.identifiers[b.index]},${
                    this.identifiers[b.index]
                  }_value)`,
              )
              .join('\n')}
            $$dirty = null
          }`;
    return this.ast;
  }

  //hacky
  destringify(str: string): string {
    return eval(`(function() {return ${str}})()`);
  }

  generateNodeStr(identifiers: string[], node: ASTNode): string {
    const identifier = identifiers[node.index];
    switch (node.type) {
      case 'Text':
        return `${identifier} = text("${(node as TextTag).value.replace(/\n/g, '\\n')}")`;
      case 'Binding':
        return `${identifier}_value = text(${
          (node as Binding).data
        })\n${identifier} = text(${identifier}_value)`;
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
    bindings.forEach((b) => {
      let exp = jsep(b.data);
      b.deps = [];
      if (exp.type === 'Identifier') {
        b.deps.push((exp as any as Identifier).name);
      } else {
        this.iterateExp(exp, b.deps);
      }
    });
  }

  iterateExp(exp: any, deps: string[]): void {
    Object.keys(exp).forEach((key) => {
      if (
        key === 'object' ||
        ((key === 'consequent' || key === 'alternate') && exp[key].type === 'Identifier')
      ) {
        (deps = deps ? deps : []).push(exp[key].name);
      } else if (typeof exp[key] === 'object' && exp[key] !== null) {
        this.iterateExp(exp[key], deps);
      }
    });
  }
}
