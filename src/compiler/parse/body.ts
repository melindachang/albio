import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import { Document, Element, type AnyNode } from 'domhandler';
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

  fragment.children.forEach((child) => {
    if (child.type === 'text') {
      if (child.data.includes('{#')) {
        const nodeType: string = child.data.split('{#')[1].split(' ')[0];
        blocks.push({
          index: blocks.length,
          nodeType: nodeType as BlockType,
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
    child.type === 'script' ? script.push(child) : tags.push(child);
  });

  for (let i = tags.length - 1; i >= 0; i--) {
    let withinBlock = false;
    let isBlock = false;
    blocks.forEach((b) => {
      if (tags[i].startIndex >= b.startNode.endIndex && tags[i].endIndex <= b.endNode.startIndex) {
        withinBlock = true;
        b.chunk.push(tags[i]);
      } else if (b.startNode === tags[i] || b.endNode === tags[i]) isBlock = true;
    });

    if (withinBlock || isBlock) tags.splice(i, 1);
  }

  return { script, tags, blocks };
};
