import { ASTNode, Block, BlockType } from '../interfaces';
import { parseHtml } from '../parse';
import Component from './Component';

export default class BlockComponent extends Component {
  type: BlockType;
  startNode: ASTNode;
  endNode: ASTNode;

  constructor(block: Block, id: string) {
    super(parseHtml(block.chunk));
    this.startNode = parseHtml([block.startNode]).nodes[0];
    this.endNode = parseHtml([block.endNode]).nodes[0];
    this.rootEntities = this.allEntities.filter((node) => node.parent === this.startNode.parent);
    this.childEntities = this.allEntities.filter((node) => node.parent !== this.startNode.parent);
    this.type = block.nodeType;
    this.identifiers = this.identifiers.map((el) => id + el);
  }
}
