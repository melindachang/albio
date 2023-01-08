import { type ASTNode, Binding, Listener } from '@core/interfaces';
import { Node, Statement } from 'estree';
import { generate_node_str, generate_attr_str } from '@utils/dom.js';
// import { b } from 'code-red';

export default class Renderer {
  allEntities: ASTNode[];
  rootEntities: ASTNode[];
  childEntities: ASTNode[];

  identifiers: string[];
  bindings: Binding[];
  reactives: Statement[];
  props: string[];
  listeners: Listener[];
  residuals: Node[];

  ast = '';

  $stale: boolean[] = [];


  constructor(nodes: ASTNode[], props: string[], reactives: Statement[], listeners: Listener[], residuals: Node[]) {
    this.allEntities = nodes;
    this.rootEntities = nodes.filter((node) => node.parent === undefined);
    this.childEntities = nodes.filter((node) => node.parent !== undefined);

    this.identifiers = nodes.map((node) => [node.type[0], node.index].join(''));
    this.bindings = nodes.filter((node) => node.type === 'Binding') as Binding[];
    this.reactives = reactives;
    this.props = props;
    this.listeners = listeners;
    this.residuals = residuals;
  }

  generate() {
    this.ast = `
      import { set_data } from 'test';

      export default function component({target, props}) {
        let {${this.props.join(',')}} = props

        ${this.residuals}

        let ${this.identifiers.concat(this.identifiers.filter((i) => i.indexOf('B') > -1).map((x) => `${x}_value`)).join(',')}

        return {
          c() {
            ${this.allEntities.map((node) => generate_node_str(this.identifiers, node)).join('\n')}
            ${this.allEntities
        .map((node) => generate_attr_str(this.identifiers, node))
        .filter((list) => list.length > 0)
        .join('\n')}
            ${this.listeners
        .map((listener) => `${this.identifiers[listener.index]}.addEventListener("${listener.event}", ${listener.handler})`)
        .join('\n')}
          },
          m() {
            ${this.childEntities.map((node) => `${this.identifiers[node.parent!.index]}.appendChild(${this.identifiers[node.index]})`).join('\n')}
            ${this.rootEntities.map((node) => `target.append(${this.identifiers[node.index]})`).join('\n')}
          },
          u(stale) {
            ${this.bindings
        .map(
          (b, i) =>
            `if (stale[${i}] && ${this.identifiers[b.index]}_value !== (${this.identifiers[b.index]}_value = eval(${b.data}) + '')) set_data(${this.identifiers[b.index]
            },${this.identifiers[b.index]}_value)`,
        )
        .join('\n')}
          }
        }
      }`;
    return this.ast;
  }
}
