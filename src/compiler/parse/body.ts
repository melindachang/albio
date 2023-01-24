import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import { Document, Element, type AnyNode } from 'domhandler';
import { Block } from '../interfaces';

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
        blocks.push({ nodeType, startNode: child, endNode: null, chunk: [] });
      } else if (child.data.includes('{/')) {
        const nodeType: string = child.data.split('{/')[1].split('}')[0];
        const i = blocks.reverse().findIndex((block) => block.nodeType === nodeType);
        blocks[i].endNode = child;
      }
    }
    if (child.type === 'script') script.push(child);
  });

  fragment.children.forEach((child) => {
    let withinBlock = false;
    let isBlock = false;
    blocks.forEach((block) => {
      if (
        child.startIndex > block.startNode.endIndex &&
        child.endIndex < block.endNode.startIndex
      ) {
        withinBlock = true;
        block.chunk.push(child);
      }
    });

    if (!withinBlock && !isBlock) tags.push(child);
  });

  return { script, tags, blocks };
};
