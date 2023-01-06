export type ASTNode = BaseNode | Text | HTMLElement | Binding | Comment;

export interface BaseNode {
  index: number;
  name?: string;
  type: string;
  parent?: ASTNode;
  children?: ASTNode[];
}

export interface Text extends BaseNode {
  type: 'Text';
  value: string;
}

export interface HTMLElement extends BaseNode {
  type: 'Element';
  attrs?: {
    [key: string]: string;
  };
}

export interface Comment extends BaseNode {
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
