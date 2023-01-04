import { Listener, TagNode, TextTag, ElementTag, BindingTag, CommentTag } from '@core/interfaces';
import { ParentNode, ChildNode, TextNode, Element, CommentNode } from 'parse5/dist/tree-adapters/default';

export const parseHtml = (tags: ChildNode[]) => {
  const nodes: TagNode[] = [];
  const eventListeners: Listener[] = [];

  parseTags(nodes, eventListeners, 0, tags);
  if (nodes.length > 0) pruneTrailingWhitespace(nodes);

  return { nodes, eventListeners };
}

export const parseTags = (nodes: TagNode[], eventListeners: Listener[], index: number, tags: ChildNode[]) => {
  tags.forEach((tag) => {
    if (tag.nodeName === '#text') {
      index = parseText(nodes, index, tag.parentNode, tag as TextNode);
    } else if (tag.nodeName === '#comment') {
      index = parseComment(nodes, index, tag.parentNode, tag as CommentNode);
    } else {
      index = parseElement(nodes, eventListeners, index, tag.parentNode, tag as Element);
    }
  });
  return index;
}

export const parseText = (nodes: TagNode[], index: number, parent: ParentNode | null, tag: TextNode) => {
  let flag = tag.value;
  let startCode, endCode;

  while (true) {
    startCode = flag.search('{');

    if (startCode === 0) {
      endCode = flag.search('}');
      index = addBinding(nodes, index, parent, flag.substring(1, endCode - 1));
      flag = flag.substring(endCode + 1);
      if (!flag) break;
    } else if (startCode < 0) {
      index = addText(nodes, index, parent, flag);
      break;
    } else {
      index = addText(nodes, index, parent, flag.substring(0, startCode));
      flag = flag.substring(startCode);
    }
  }

  return index;
}

export const addText = (nodes: TagNode[], index: number, parent: ParentNode | null, value: string) => {
  if (index === 0 && value.trim() === '') return index;

  nodes.push({
    index,
    type: 'Text',
    value,
    parent,
  } as TextTag);

  return index + 1;
}

export const addBinding = (nodes: TagNode[], index: number, parent: ParentNode | null, name: string) => {
  nodes.push({
    index,
    type: 'Binding',
    name,
    parent,
  } as BindingTag);

  return index + 1;
}

export const parseElement = (
  nodes: TagNode[],
  eventListeners: Listener[],
  index: number,
  parent: ParentNode | null,
  tag: Element,
) => {
  const attrs: { [key: string]: string } = {};

  if (tag.attrs) {
    tag.attrs.forEach((attr) => {
      if (attr.name.match(/^on:/)) {
        eventListeners.push({
          index,
          event: attr.name.split(':')[1],
          handler: attr.value,
        });
      } else {
        attrs[attr.name] = attr.value;
      }
    });
  }

  nodes.push({
    index,
    type: 'Element',
    attrs,
    name: tag.nodeName,
    parent,
  } as ElementTag);

  return parseTags(nodes, eventListeners, index + 1, tag.childNodes);
}

export const parseComment = (nodes: TagNode[], index: number, parent: ParentNode | null, tag: CommentNode) => {
  nodes.push({
    index,
    type: 'Comment',
    parent,
    value: tag.data,
  } as CommentTag);

  return index + 1;
}

export const pruneTrailingWhitespace = (nodes: TagNode[]) => {
  let i = nodes.length - 1;
  let node = nodes[i];

  while (node.parent === null && node.type === 'Text' && (node as TextTag).value.trim() === '') {
    nodes.splice(i, 1);

    i -= 1;
    node = nodes[i];
  }
}
