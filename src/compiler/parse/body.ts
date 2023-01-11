import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { Htmlparser2TreeAdapterMap } from 'parse5-htmlparser2-tree-adapter';
import { Element } from 'domhandler';

export const extractFragment = (path: string) => {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment = parseFragment<Htmlparser2TreeAdapterMap>(source);
  const tags = [];
  const script = [];

  fragment.childNodes.forEach((child) => {
    (child as Element).name === 'script' ? script.push(child) : tags.push(child);
  });

  return { script, tags };
};
