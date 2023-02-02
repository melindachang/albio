import { Node } from 'estree';
import { analyze } from 'periscopic';
import { ASTNode, Binding, IterableKey, Listener } from '../interfaces';
import { CompilerParams } from '../interfaces';
import { parse } from '../utils';

export default abstract class Component {
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

  abstract populateDeps(...args: any): void;
}
