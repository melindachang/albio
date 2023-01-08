import {
  type ASTNode,
  Binding,
  Listener,
  DirtMarker,
  ElementTag,
  TextTag,
  Props,
} from '@core/interfaces';
import { Identifier, Node, Statement } from 'estree';
import { b } from 'code-red';
import jsep from 'jsep';
import util from 'util';

export default class Renderer {
  all_entities: ASTNode[];
  root_entities: ASTNode[];
  child_entities: ASTNode[];

  identifiers: string[];
  bindings: Binding[];
  reactive_blocks: Statement[];
  props: Props;
  listeners: Listener[];
  residual_nodes: Node[];

  ast: Node[];

  dirty: DirtMarker;

  constructor(
    nodes: ASTNode[],
    props: Props,
    reactive_blocks: Statement[],
    listeners: Listener[],
    residual_nodes: Node[],
  ) {
    this.all_entities = nodes;
    this.root_entities = nodes.filter((node) => node.parent === undefined);
    this.child_entities = nodes.filter((node) => node.parent !== undefined);

    this.identifiers = nodes.map((node) => [node.type[0], node.index].join(''));
    this.bindings = nodes.filter((node) => node.type === 'Binding') as Binding[];
    this.reactive_blocks = reactive_blocks;
    this.props = props;
    this.listeners = listeners;
    this.residual_nodes = residual_nodes;

    this.ast = [];
    this.dirty = null;

    this.populate_deps(this.bindings);
  }

  // TODO messy

  generate(): Node[] {
    this.ast = b`
      import { set_data, text, check_dirty_deps } from 'test';

      export default function render({target}) {
        let {${Object.keys(this.props).join(',')}} = ${util.inspect(
      Object.fromEntries(Object.entries(this.props).map(([k, v]) => [k, this.destringify(v)])),
    )}
        let $deps

        ${this.residual_nodes}

        let ${this.identifiers
          .concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`))
          .join(',')}

        return {
          c() {
            ${this.all_entities
              .map((node) => this.generate_node_str(this.identifiers, node))
              .join('\n')}
            ${this.all_entities
              .map((node) => this.generate_attr_str(this.identifiers, node))
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
          m() {
            ${this.child_entities
              .map(
                (node) =>
                  `${this.identifiers[node.parent!.index]}.appendChild(${
                    this.identifiers[node.index]
                  })`,
              )
              .join('\n')}
            ${this.root_entities
              .map((node) => `target.append(${this.identifiers[node.index]})`)
              .join('\n')}
          },
          u($dirty) {
            ${this.bindings
              .map(
                (b) =>
                  `$deps = [${b.deps.map(
                    (d) => `\"${d}\"`,
                  )}]\nif (check_dirty_deps($dirty, $deps) && ${
                    this.identifiers[b.index]
                  }_value !== (${this.identifiers[b.index]}_value = eval(${
                    b.data
                  }) + '')) set_data(${this.identifiers[b.index]},${
                    this.identifiers[b.index]
                  }_value)`,
              )
              .join('\n')}
          }
        }
      }`;
    return this.ast;
  }

  //hacky
  destringify(str: string): string {
    return eval(`(function() {return ${str}})()`);
  }

  generate_node_str(identifiers: string[], node: ASTNode): string {
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

  generate_attr_str(identifiers: string[], node: ASTNode): string[] {
    if (!(node as ElementTag).attrs) return [];
    const identifier = identifiers[node.index];
    return Object.entries((node as ElementTag).attrs!).map(
      ([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`,
    );
  }

  populate_deps(bindings: Binding[]): void {
    bindings.forEach((b) => {
      let exp = jsep(b.data);
      b.deps = [];
      if (exp.type === 'Identifier') {
        b.deps.push((exp as any as Identifier).name);
      } else {
        this.iterate_exp(exp, b.deps);
      }
    });
  }

  iterate_exp(exp: any, deps: string[]): void {
    Object.keys(exp).forEach((key) => {
      if (
        key === 'object' ||
        ((key === 'consequent' || key === 'alternate') && exp[key].type === 'Identifier')
      ) {
        (deps = deps ? deps : []).push(exp[key].name);
      } else if (typeof exp[key] === 'object' && exp[key] !== null) {
        this.iterate_exp(exp[key], deps);
      }
    });
  }
}
