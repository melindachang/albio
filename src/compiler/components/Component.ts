import { ChildNode } from 'domhandler';
import { Block, type BlockType } from '../interfaces';

export default class Component {
  type: BlockType;
  startNode: ChildNode;
  endNode: ChildNode;
  chunk: ChildNode[];

  constructor(block: Block) {
    this.type = block.nodeType;
    this.startNode = block.startNode;
    this.endNode = block.endNode;
    this.chunk = block.chunk;
  }
}
