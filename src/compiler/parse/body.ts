import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { ChildNode, Element } from 'parse5/dist/tree-adapters/default';

export const extractFragment = (path: string) => {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment = parseFragment(source);
  const tags: ChildNode[] = [];
  const script: Element[] = [];

  fragment.childNodes.forEach((child: ChildNode) => {
    child.nodeName === 'script' ? script.push(child) : tags.push(child);
  });

  return { script, tags };
};
