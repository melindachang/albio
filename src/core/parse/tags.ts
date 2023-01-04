import { Attribute } from 'parse5/dist/common/token';
import { EventListener, TagNode, TextTag, ElementTag, BindingTag, CommentTag } from '@/core/interfaces';
import { ParentNode, ChildNode, TextNode, Element, CommentNode } from 'parse5/dist/tree-adapters/default';

export function parseHtml(tags: ChildNode[]) {
  const nodes: TagNode[] = [];
  const eventListeners: EventListener[] = [];

  parseTags(nodes, eventListeners, 0, tags);

  if (nodes.length > 0) removeTrailingWhitespace(nodes);

  return { nodes, eventListeners };
}

export function parseTags(
  nodes: TagNode[],
  eventListeners: EventListener[],
  index: number,
  tags: ChildNode[],
) {
  tags.forEach((tag) => {
    if (tag.nodeName === '#text') {
      index = parseText(nodes, index, tag.parentNode, (tag as TextNode));
    } else if (tag.nodeName === '#comment') {
      index = parseComment(nodes, index, tag.parentNode, (tag as CommentNode));
    } else {
      index = parseElement(nodes, eventListeners, index, tag.parentNode, (tag as Element));
    }
  });

  return index;
}

export function parseText(nodes: TagNode[], index: number, parent: ParentNode | null, tag: TextNode) {
  let flag = tag.value;
  let startBracket, endBracket;

  while (true) {
    startBracket = flag.search('{');

    if (startBracket === 0) {
      endBracket = flag.search('}');
      index = addBinding(nodes, index, parent, flag.substring(1, endBracket - 1));
      flag = flag.substring(endBracket + 1);
      if (!flag) break;
    } else if (startBracket < 0) {
      index = addText(nodes, index, parent, flag);
      break;
    } else {
      index = addText(nodes, index, parent, flag.substring(0, startBracket));
      flag = flag.substring(startBracket);
    }
  }

  return index;
}

export function addText(nodes: TagNode[], index: number, parent: ParentNode | null, value: string) {
  if (index === 0 && value.trim() === '') return index;

  let text: TextTag = {
    index,
    type: 'Text',
    value,
    parent,
  }

  nodes.push(text);

  return index + 1;
}

export function addBinding(nodes: TagNode[], index: number, parent: ParentNode | null, name: string) {
  let bind: BindingTag = {
    index,
    type: 'Binding',
    name,
    parent,
  }
  nodes.push(bind);

  return index + 1;
}

export function parseElement(
  nodes: TagNode[],
  eventListeners: EventListener[],
  index: number,
  parent: ParentNode | null,
  tag: Element,
) {
  const attrs: { [key: string]: string } = {};

  if (tag.attrs) {
    tag.attrs.forEach((attr: Attribute) => {
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

  let elem: ElementTag = {
    index,
    type: 'Element',
    attrs,
    name: tag.nodeName,
    parent,
  }

  nodes.push(elem);

  return parseTags(nodes, eventListeners, index + 1, tag.childNodes);
}

export function parseComment(nodes: TagNode[], index: number, parent: ParentNode | null, tag: CommentNode) {
  let value = tag.data;
  let comment: CommentTag = {
    index,
    type: 'Comment',
    parent,
    value
  }

  nodes.push(comment);

  return index + 1;
}

export function removeTrailingWhitespace(nodes: TagNode[]) {
  let i = nodes.length - 1;
  let node = nodes[i];

  while (node.parent === null && node.type === 'Text' && (node as TextTag).value.trim() === '') {
    nodes.splice(i, 1);

    i -= 1;
    node = nodes[i];
  }
}
