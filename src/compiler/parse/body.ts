import { readFileSync } from 'fs';
import { parseFragment } from 'parse5';
import { ChildNode, DocumentFragment, TextNode } from 'parse5/dist/tree-adapters/default';

export function parseFile(path: string) {
  const source = path.endsWith('.html') ? readFileSync(path, { encoding: 'utf8' }) : path;
  const fragment = parseFragment(source);

  return fragment;
}

export const extractFragment = (fragment: DocumentFragment) => {
  const tags: ChildNode[] = [];
  let script = '';

  fragment.childNodes.forEach((child: ChildNode) => {
    if (child.nodeName === 'script') {
      let i = child.attrs.findIndex((attr) => attr.name === 'src');
      script +=
        i > -1 ? readFileSync(child.attrs[i].value) : (child.childNodes[0] as TextNode).value;
    } else {
      tags.push(child);
    }
  });

  return { script, tags };
};
