import { Listener, TextTag, ElementTag, type ASTNode, Binding } from '../interfaces';
import { Text, Element, Comment, type AnyNode } from 'domhandler';
import { TagToken } from 'parse5/dist/common/token';

export function parseTags(
  nodes: ASTNode[],
  listeners: Listener[],
  index: number,
  tags: AnyNode[],
  parent?: ASTNode,
): number {
  tags.forEach((tag) => {
    if (tag.type === 'text') {
      index = parseText(nodes, index, tag as Text, parent);
    } else if (tag.type === 'comment') {
      index = parseComment(nodes, index, tag as Comment, parent);
    } else {
      index = parseElement(nodes, listeners, index, tag as Element, parent);
    }
  });
  return index;
}

export function parseText(nodes: ASTNode[], index: number, tag: Text, parent?: ASTNode): number {
  let flag = tag.data;
  let startCode: number, endCode: number;

  while (true) {
    startCode = flag.search('{');

    if (startCode === 0) {
      endCode = flag.lastIndexOf('}');
      index = addBinding(nodes, index, flag.substring(1, endCode), parent);
      flag = flag.substring(endCode + 1);
      if (!flag) break;
    } else if (startCode < 0) {
      index = addText(nodes, index, flag, tag, parent);
      break;
    } else {
      index = addText(nodes, index, flag.substring(0, startCode), tag, parent);
      flag = flag.substring(startCode);
    }
  }

  return index;
}

export function addText(
  nodes: ASTNode[],
  index: number,
  value: string,
  tag: Text,
  parent?: ASTNode,
): number {
  if (index === 0 && value.trim() === '') return index;

  nodes.push({
    index,
    type: 'Text',
    value,
    parent,
    startIndex: tag.startIndex,
    endIndex: tag.endIndex,
  });

  return index + 1;
}

export function addBinding(
  nodes: ASTNode[],
  index: number,
  data: string,
  parent?: ASTNode,
): number {
  nodes.push({
    index,
    type: 'Binding',
    data,
    parent,
  } as Binding);

  return index + 1;
}

export function parseElement(
  nodes: ASTNode[],
  listeners: Listener[],
  index: number,
  tag: Element,
  parent?: ASTNode,
) {
  let attrs: { [key: string]: string } = {};

  if (tag.attribs) {
    Object.entries(tag.attribs).forEach(([k, v]) => {
      if (k.match(/^on:/)) {
        listeners.push({
          index,
          event: k.split(':')[1],
          handler: v,
        });
      } else {
        attrs[k] = v;
      }
    });
  }

  let el: ElementTag = {
    index,
    type: 'Element',
    attrs,
    name: tag.name,
    parent,
    startIndex: tag.startIndex,
    endIndex: tag.endIndex,
  };
  nodes.push(el);

  return parseTags(nodes, listeners, index + 1, tag.children, el);
}

export function parseComment(
  nodes: ASTNode[],
  index: number,
  tag: Comment,
  parent?: ASTNode,
): number {
  nodes.push({
    index,
    type: 'Comment',
    parent,
    value: tag.data,
    startIndex: tag.startIndex,
    endIndex: tag.endIndex,
  });

  return index + 1;
}

export function pruneTrailingWhitespace(nodes: ASTNode[]): void {
  let i = nodes.length - 1;
  let node = nodes[i];

  while (node.parent === null && node.type === 'Text' && (node as TextTag).value.trim() === '') {
    nodes.splice(i, 1);
    i -= 1;
    node = nodes[i];
  }
}

export function parseHtml(tags: AnyNode[]): { nodes: ASTNode[]; listeners: Listener[] } {
  const nodes: ASTNode[] = [];
  const listeners: Listener[] = [];

  parseTags(nodes, listeners, 0, tags);
  if (nodes.length > 0) pruneTrailingWhitespace(nodes);

  return { nodes, listeners };
}
