import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import { Document, Element, type AnyNode } from 'domhandler';

export const extractFragment = (path: string) => {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment: Document = parseFragment(source, { treeAdapter: adapter });
  const script: Element[] = [];
  const tags: AnyNode[] = [];

  fragment.children.forEach((child) => {
    child.type === 'script' ? script.push(child) : tags.push(child);
  });

  return { script, tags };
};
