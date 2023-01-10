import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { ChildNode, DocumentFragment, Element } from 'parse5/dist/tree-adapters/default';

export function parseFile(path: string) {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment = parseFragment(source);

  return fragment;
}

export const extractFragment = (fragment: DocumentFragment) => {
  const tags: ChildNode[] = [];
  const script: Element[] = [];

  fragment.childNodes.forEach((child: ChildNode) => {
    child.nodeName === 'script' ? script.push(child) : tags.push(child);
    // script +=
    //   i > -1 ? readFileSync(child.attrs[i].value) : (child.childNodes[0] as TextNode).value;
  });

  return { script, tags };
};
