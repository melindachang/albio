import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { Htmlparser2TreeAdapterMap } from 'parse5-htmlparser2-tree-adapter';
import { Element, Node } from 'domhandler';

export const extractFragment = (path: string): { script: Node[]; tags: Node[] } => {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment = parseFragment<Htmlparser2TreeAdapterMap>(source);
  const script: Node[] = [];
  const tags: Node[] = [];

  fragment.childNodes.forEach((child) => {
    (child as Element).name === 'script' ? script.push(child) : tags.push(child);
  });

  return { script, tags };
};
