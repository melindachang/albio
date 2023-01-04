import { ParentNode, ChildNode } from 'parse5/dist/tree-adapters/default';

export interface TagNode {
    index: number;
    name?: string;
    type: string;
    parent: ParentNode | null;
    children?: ChildNode[];
}

export interface TextTag extends TagNode {
    type: 'Text';
    value: string;
}

export interface ElementTag extends TagNode {
    type: 'Element';
    attrs?: {
        [key: string]: string;
    }
}

export interface CommentTag extends TagNode {
    type: 'Comment';
    value: string;
}

export interface BindingTag extends TagNode {
    type: 'Binding';
    name: string;
}

export interface EventListener {
    index: number;
    event: string;
    handler: string;
}