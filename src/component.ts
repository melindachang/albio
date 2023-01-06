import { Listener, ASTNode, Binding, HTMLElement, Text } from '@core/interfaces';
import { Node } from 'estree';

export class Component {
  allEntities: ASTNode[] = [];

  identifiers: string[] = [];
  rootEntities: ASTNode[] = [];
  childEntities: ASTNode[] = [];
  bindings: Binding[] = [];

  props: string[] = [];
  listeners: Listener[] = [];
  residualNodes: Node[] = [];

  ast: string = '';

  constructor(nodes: ASTNode[], props: string[], listeners: Listener[], rest: Node[]) {
    this.allEntities = nodes;

    this.identifiers = nodes.map((node) => [node.type[0], node.index].join(''));
    this.rootEntities = nodes.filter((node) => node.parent === undefined);
    this.childEntities = nodes.filter((node) => node.parent !== undefined);
    this.bindings = nodes.filter((node) => node.type === 'Binding') as Binding[];

    this.props = props;
    this.listeners = listeners;
    this.residualNodes = rest;
  }

  create() {
    this.ast = `
    export default function component({target, props}) {
      let {${this.props.join(',')}} = props

      ${this.residualNodes}

      let ${this.identifiers.join(',')}

      return {
        create() {
          ${this.allEntities.map((node) => this.generateNodeString(this.identifiers, node)).join('\n')}
          ${this.allEntities
            .map((node) => this.generateAttrString(this.identifiers, node))
            .filter((list) => list.length > 0)
            .join('\n')}
          ${this.listeners
            .map(
              (listener) =>
                `${this.identifiers[listener.index]}.addEventListener("${listener.event}", ${listener.handler})`,
            )
            .join('\n')}
        },
        mount() {
          ${this.childEntities
            .map((node) => `${this.identifiers[node.parent!.index]}.appendChild(${this.identifiers[node.index]})`)
            .join('\n')}
          ${this.rootEntities.map((node) => `target.append(${this.identifiers[node.index]})`).join('\n')}
        },
        update(changes) {
          ${this.bindings
            .map(
              (node) =>
                `if (changes.${node.name}) {\n${this.identifiers[node.index]}.data = ${node.name} = changes.${
                  node.name
                }\n}`,
            )
            .join('\n')}
        },
        detach() {
          ${this.rootEntities.map((node) => `target.removeChild(${this.identifiers[node.index]})`).join('\n')}
        }
      }
    }`;

    return this.ast;
  }

  generateNodeString(identifiers: string[], node: ASTNode): string {
    const identifier = identifiers[node.index];
    switch (node.type) {
      case 'Text':
        return `${identifier} = document.createTextNode("${(node as Text).value.replace(/\n/g, '\\n')}")`;
      case 'Binding':
        return `${identifier} = document.createTextNode(${node.name})`;
      default:
        return `${identifier} = document.createElement("${node.name}")`;
    }
  }

  generateAttrString(identifiers: string[], node: ASTNode): string[] {
    if (!(node as HTMLElement).attrs) return [];

    const identifier = identifiers[node.index];
    return Object.entries((node as HTMLElement).attrs!).map(
      ([name, value]) => `${identifier}.setAttribute("${name}", "${value}")`,
    );
  }
}
