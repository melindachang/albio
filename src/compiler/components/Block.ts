import { Node } from 'estree';
import { ASTNode, Block, BlockType } from '../interfaces';
import { parseHtml } from '../parse';
import Component from './Component';

export default abstract class BlockComponent extends Component {
  type: BlockType;
  startNode: ASTNode;
  endNode: ASTNode;
  index: number;

  constructor(block: Block) {
    super(parseHtml(block.chunk));
    this.index = block.index;
    this.startNode = parseHtml([block.startNode]).nodes[0];
    this.endNode = parseHtml([block.endNode]).nodes[0];
    this.rootEntities = this.allEntities.filter((node) => node.parent === this.startNode.parent);
    this.childEntities = this.allEntities.filter((node) => node.parent !== this.startNode.parent);
    this.type = block.nodeType;
    this.identifiers = this.identifiers.map((el) => this.type + el);
  }

  abstract render(): Node;
}
