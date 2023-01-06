import { readFileSync } from 'fs';
import { parseFragment, DefaultTreeAdapterMap } from 'parse5';
import { ChildNode, DocumentFragment, TextNode } from 'parse5/dist/tree-adapters/default';

export const parseFile = (path: string) => {
  const source = readFileSync(path, { encoding: 'utf8' });
  const fragment = parseFragment<DefaultTreeAdapterMap>(source);

  return fragment;
};

export const extract = (fragment: DocumentFragment) => {
  const tags: ChildNode[] = [];
  let script = '';

  fragment.childNodes.forEach((child: ChildNode) => {
    if (child.nodeName === 'script') {
      let i = child.attrs.findIndex(attr => attr.name === 'src');
      if (i > -1) {
        script += readFileSync(child.attrs[i].value);
      } else {
        script += (child.childNodes[0] as TextNode).value;

      }
    } else {
      tags.push(child);
    }
  });

  return { script, tags };
};
