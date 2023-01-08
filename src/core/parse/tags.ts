import { Listener, TextTag, ElementTag, type ASTNode } from '@core/interfaces';
import { ChildNode, TextNode, Element, CommentNode } from 'parse5/dist/tree-adapters/default';

const parseTags = (
  nodes: ASTNode[],
  listeners: Listener[],
  index: number,
  tags: ChildNode[],
  parent?: ASTNode,
) => {
  tags.forEach((tag) => {
    if (tag.nodeName === '#text') {
      index = parseText(nodes, index, tag as TextNode, parent);
    } else if (tag.nodeName === '#comment') {
      index = parseComment(nodes, index, tag as CommentNode, parent);
    } else {
      index = parseElement(nodes, listeners, index, parent, tag as Element);
    }
  });
  return index;
};

const parseText = (nodes: ASTNode[], index: number, tag: TextNode, parent?: ASTNode) => {
  let flag = tag.value;
  let startCode, endCode;

  while (true) {
    startCode = flag.search('{');

    if (startCode === 0) {
      endCode = flag.search('}');
      index = addBinding(nodes, index, flag.substring(1, endCode), parent);
      flag = flag.substring(endCode + 1);
      if (!flag) break;
    } else if (startCode < 0) {
      index = addText(nodes, index, flag, parent);
      break;
    } else {
      index = addText(nodes, index, flag.substring(0, startCode), parent);
      flag = flag.substring(startCode);
    }
  }

  return index;
};

const addText = (nodes: ASTNode[], index: number, value: string, parent?: ASTNode) => {
  if (index === 0 && value.trim() === '') return index;

  nodes.push({
    index,
    type: 'Text',
    value,
    parent,
  });

  return index + 1;
};

const addBinding = (nodes: ASTNode[], index: number, data: string, parent?: ASTNode) => {
  nodes.push({
    index,
    type: 'Binding',
    data,
    parent,
  });

  return index + 1;
};

const parseElement = (
  nodes: ASTNode[],
  listeners: Listener[],
  index: number,
  parent: ASTNode | undefined,
  tag: Element,
) => {
  const attrs: { [key: string]: string } = {};

  if (tag.attrs) {
    tag.attrs.forEach((attr) => {
      if (attr.name.match(/^on:/)) {
        listeners.push({
          index,
          event: attr.name.split(':')[1],
          handler: attr.value,
        });
      } else {
        attrs[attr.name] = attr.value;
      }
    });
  }

  let el: ElementTag = {
    index,
    type: 'Element',
    attrs,
    name: tag.nodeName,
    parent,
  };
  nodes.push(el);

  return parseTags(nodes, listeners, index + 1, tag.childNodes, el);
};

const parseComment = (nodes: ASTNode[], index: number, tag: CommentNode, parent?: ASTNode) => {
  nodes.push({
    index,
    type: 'Comment',
    parent,
    value: tag.data,
  });

  return index + 1;
};

const pruneTrailingWhitespace = (nodes: ASTNode[]) => {
  let i = nodes.length - 1;
  let node = nodes[i];

  while (node.parent === null && node.type === 'Text' && (node as TextTag).value.trim() === '') {
    nodes.splice(i, 1);
    i -= 1;
    node = nodes[i];
  }
};

export const parseHtml = (tags: ChildNode[]) => {
  const nodes: ASTNode[] = [];
  const listeners: Listener[] = [];

  parseTags(nodes, listeners, 0, tags);
  if (nodes.length > 0) pruneTrailingWhitespace(nodes);

  return { nodes, listeners };
};
