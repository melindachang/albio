import { AnyNode } from 'domhandler';
import { LabeledStatement, Node, Statement } from 'estree';
import { Component } from './components';

export type ASTNode = BaseNode | TextTag | ElementTag | Binding | CommentTag;
export type BlockType = 'each' | 'if' | 'else';

/**
 * Maybe include start and end location in parsing instead of index so that you can incorporate blocks
 * Compiler $$invalidate function should pass in an array of update functions for every component with
 *  the reassigned variable as a dependency
 */

interface BaseNode {
  index: number;
  name?: string;
  type: string;
  parent?: ASTNode;
  children?: ASTNode[];
  next?: ASTNode;
  prev?: ASTNode;
  startIndex: number | null;
  endIndex: number | null;
}

export interface Block {
  index: number;
  nodeType: BlockType;
  parent: AnyNode;
  start_node: AnyNode;
  end_node: AnyNode | null;
  chunk: AnyNode[];
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

export interface Reference {
  type?: string;
  index: number;
  var: string;
  ref: string;
  assoc_events?: string[];
  deps?: string[];
}

export interface CompilerParams {
  nodes: ASTNode[];
  listeners: Listener[];
  references: Reference[];
  props?: Props;
  reactives?: ReactiveStatement[];
  residuals?: Node[];
  blocks?: Component[];
}

export interface ReactiveStatement {
  chunk: Statement;
  deps: string[];
}

export interface IterableKey {
  name: string;
  variableRef: string;
}
