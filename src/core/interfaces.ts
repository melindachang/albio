export type ASTNode = BaseNode | TextTag | ElementTag | Binding | CommentTag;

interface BaseNode {
  index: number;
  name?: string;
  type: string;
  parent?: ASTNode;
  children?: ASTNode[];
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
  data: string;
}

export interface Listener {
  index: number;
  event: string;
  handler: string;
}

export interface Flag {
  parentNode?: ASTNode;
  binding: Binding;
  id: string;
}
