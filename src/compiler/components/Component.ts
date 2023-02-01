import { ASTNode, Binding, Listener } from '../interfaces';
import { CompilerParams } from '../interfaces';

export default class Component {
  allEntities: ASTNode[];
  rootEntities: ASTNode[];
  childEntities: ASTNode[];
  bindings: Binding[];
  listeners: Listener[];
  identifiers: string[];

  constructor(parsed: CompilerParams) {
    this.allEntities = parsed.nodes;
    this.listeners = parsed.listeners;
    this.identifiers = parsed.nodes.map((node) => [node.type[0], node.index].join(''));
    this.bindings = parsed.nodes.filter((node) => node.type === 'Binding') as Binding[];
  }
}
