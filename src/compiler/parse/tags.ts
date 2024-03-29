import {
  Listener,
  TextTag,
  ElementTag,
  type ASTNode,
  Binding,
  Reference,
} from '../interfaces';
import { Text, Element, Comment, type AnyNode } from 'domhandler';
import { get_associated_events } from '../utils';

export function parse_tags(
  nodes: ASTNode[],
  listeners: Listener[],
  references: Reference[],
  index: number,
  tags: AnyNode[],
  parent?: ASTNode,
): number {
  tags.forEach((tag) => {
    if (tag.type === 'text') {
      index = parse_text(nodes, index, tag as Text, parent);
    } else if (tag.type === 'comment') {
      index = parse_comment(nodes, index, tag as Comment, parent);
    } else {
      index = parse_element(
        nodes,
        listeners,
        references,
        index,
        tag as Element,
        parent,
      );
    }
  });
  return index;
}

export function parse_text(
  nodes: ASTNode[],
  index: number,
  tag: Text,
  parent?: ASTNode,
): number {
  let flag = tag.data;
  let startCode: number, endCode: number;

  while (true) {
    startCode = flag.search('{');

    if (startCode === 0) {
      endCode = flag.lastIndexOf('}');
      index = add_binding(
        nodes,
        index,
        flag.substring(1, endCode),
        tag,
        parent,
      );
      flag = flag.substring(endCode + 1);
      if (!flag) break;
    } else if (startCode < 0) {
      index = add_text(nodes, index, flag, tag, parent);
      break;
    } else {
      index = add_text(nodes, index, flag.substring(0, startCode), tag, parent);
      flag = flag.substring(startCode);
    }
  }

  return index;
}

export function add_text(
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

export function add_binding(
  nodes: ASTNode[],
  index: number,
  data: string,
  tag: AnyNode,
  parent?: ASTNode,
): number {
  nodes.push({
    index,
    type: 'Binding',
    data,
    parent,
    startIndex: tag.startIndex,
    endIndex: tag.endIndex,
  } as Binding);

  return index + 1;
}

export function parse_element(
  nodes: ASTNode[],
  listeners: Listener[],
  references: Reference[],
  index: number,
  tag: Element,
  parent?: ASTNode,
) {
  let attrs: { [key: string]: string } = {};

  if (tag.attribs) {
    Object.entries(tag.attribs).forEach(([k, v]) => {
      if (k.match(/^on:/) || k.substring(0, 1).match(/^@/)) {
        const div = k.search('@') > -1 ? '@' : ':';
        listeners.push({
          index,
          event: k.split(div)[1],
          handler: v,
        });
      } else if (k.match(/^bind:/) || k.substring(0, 1).match(/^:/)) {
        const bound = k.split(':')[1];
        const assoc_events: string[] = get_associated_events(bound);
        references.push({
          index,
          var: bound,
          ref: v,
          assoc_events,
        });
      } else if (k.match(/^class:/)) {
        const bound = k.split(':')[1];
        // Var = Class Name
        // Ref = dependent
        references.push({
          type: 'class',
          index,
          var: bound,
          ref: v,
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

  return parse_tags(nodes, listeners, references, index + 1, tag.children, el);
}

export function parse_comment(
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

export function prune_trailing_whitespace(nodes: ASTNode[]): void {
  let i = nodes.length - 1;
  let node = nodes[i];

  while (
    node.parent === null &&
    node.type === 'Text' &&
    (node as TextTag).value.trim() === ''
  ) {
    nodes.splice(i, 1);
    i -= 1;
    node = nodes[i];
  }
}

export function parse_html(tags: AnyNode[]): {
  nodes: ASTNode[];
  listeners: Listener[];
  references: Reference[];
} {
  const nodes: ASTNode[] = [];
  const listeners: Listener[] = [];
  const references: Reference[] = [];

  parse_tags(nodes, listeners, references, 0, tags);
  if (nodes.length > 0) prune_trailing_whitespace(nodes);

  return { nodes, listeners, references };
}
