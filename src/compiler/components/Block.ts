import { Node } from 'estree';
import { ASTNode, Block, BlockType } from '../interfaces';
import { parse_html } from '../parse';
import Component from './Component';

export default abstract class BlockComponent extends Component {
  type: BlockType;
  start_node: ASTNode;
  end_node: ASTNode;
  index: number;

  constructor(block: Block) {
    super(parse_html(block.chunk));
    this.index = block.index;
    this.start_node = parse_html([block.start_node]).nodes[0];
    this.end_node = parse_html([block.end_node]).nodes[0];
    this.root_entities = this.all_entities.filter(
      (node) => node.parent === this.start_node.parent,
    );
    this.child_entities = this.all_entities.filter(
      (node) => node.parent !== this.start_node.parent,
    );
    this.type = block.nodeType;
  }

  abstract render(...args: any): Node;
}
