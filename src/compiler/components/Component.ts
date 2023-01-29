import { type AnyNode } from 'domhandler';
import { ASTNode, Binding, Block, Listener, type BlockType } from '../interfaces';
import { parseHtml } from '../parse';

export default class Component {
  type: BlockType;
  startNode: ASTNode;
  endNode: ASTNode;

  allEntities: ASTNode[];
  rootEntities: ASTNode[];
  childEntities: ASTNode[];
  bindings: Binding[];
  listeners: Listener[];
  identifiers: string[];

  constructor(block: Block, id: string) {
    this.type = block.nodeType;
    this.startNode = parseHtml([block.startNode]).nodes[0];
    this.endNode = parseHtml([block.endNode]).nodes[0];

    const parsed = parseHtml(block.chunk);
    this.allEntities = parsed.nodes;
    this.rootEntities = this.allEntities.filter((node) => node.parent === this.startNode.parent);
    this.childEntities = this.allEntities.filter((node) => node.parent !== this.startNode.parent);
    this.listeners = parsed.listeners;
    this.identifiers = this.generate_identifiers(id);
    this.bindings = this.allEntities.filter((node) => node.type === 'Binding') as Binding[];
  }

  generate_identifiers(id: string): string[] {
    return this.allEntities.map((node) => [id, node.type[0], node.index].join(''));
  }
}
