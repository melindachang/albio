import { ChildNode } from 'domhandler';

export type ASTNode = BaseNode | TextTag | ElementTag | Binding | CommentTag;
// HTML
export type BlockType = 'each' | 'if' | 'else';

interface BaseNode {
  index: number;
  name?: string;
  type: string;
  parent?: ASTNode;
  children?: ASTNode[];
}

export interface Block {
  nodeType: BlockType;
  startNode: ChildNode;
  endNode: ChildNode | null;
  chunk: ChildNode[];
}
export interface EachBlock extends Block {
  nodeType: 'each';
}

export interface IfBlock extends Block {
  nodeType: 'if';
}

export interface ElseBlock extends Block {
  nodeType: 'else';
  linkedIfBlock: Block;
}

export interface TextTag extends BaseNode {
  type: 'Text';
  value: string;
}

export interface ElementTag extends BaseNode {
  type: 'Element';
  attrs?: {
    [key: string]: string;
  };
}

export interface CommentTag extends BaseNode {
  type: 'Comment';
  value: string;
}

export interface Binding extends BaseNode {
  type: 'Binding';
  default_value: string;
  data: string;
  deps: string[];
}

export interface Props {
  [key: string]: any;
}

export interface Listener {
  index: number;
  event: string;
  handler: string;
}
