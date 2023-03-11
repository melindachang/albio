import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import { ChildNode, Document, Element, hasChildren, type AnyNode } from 'domhandler';
import { Block, BlockType } from '../interfaces';

export const extractFragment = (path: string) => {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment: Document = parseFragment(source, {
    treeAdapter: adapter,
    sourceCodeLocationInfo: true,
  });
  const script: Element[] = [];
  const tags: AnyNode[] = [];
  const blocks: Block[] = [];

  const extract_blocks = (child: ChildNode) => {
    if (hasChildren(child)) {
      child.children.forEach((gchild) => extract_blocks(gchild));
    } else {
      if (child.type === 'text') {
        if (child.data.includes('{#')) {
          const nodeType: string = child.data.split('{#')[1].split(' ')[0];
          blocks.push({
            index: blocks.length,
            nodeType: nodeType as BlockType,
            parent: child.parent,
            startNode: child,
            endNode: null,
            chunk: [],
          });
        } else if (child.data.includes('{/')) {
          const nodeType: string = child.data.split('{/')[1].split('}')[0];
          const i = blocks.reverse().findIndex((b) => b.nodeType === nodeType);
          blocks[i].endNode = child;
        }
      }
    }
  };

  fragment.children.forEach((child) => {
    extract_blocks(child);
    child.type === 'script' ? script.push(child) : tags.push(child);
  });

  for (let i = tags.length - 1; i >= 0; i--) {
    const extract_chunk = (b: Block, tag: AnyNode, parentArr = tags) => {
      if (tag.parent === b.startNode.parent) {
        const ind = parentArr.indexOf(tag);
        if (tag.startIndex >= b.startNode.endIndex && tag.endIndex <= b.endNode.startIndex) {
          b.chunk.push(tag);
          parentArr.splice(ind, 1);
        } else if (b.startNode === tag || b.endNode === tag) {
          parentArr.splice(ind, 1);
        }
      } else if (hasChildren(tag)) {
        for (let j = tag.children.length - 1; j >= 0; j--) {
          extract_chunk(b, tag.children[j], tag.children);
        }
      }
    };

    blocks.forEach((b) => {
      extract_chunk(b, tags[i]);
    });
  }

  return { script, tags, blocks };
};
