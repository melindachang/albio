import { readFileSync } from 'fs';
import { parseFragment, DefaultTreeAdapterMap } from 'parse5';
import { DocumentFragment, ChildNode, TextNode } from 'parse5/dist/tree-adapters/default';

export function extract(path: string) {
  const source: string = readFileSync(path, { encoding: 'utf8' });
  const fragment: DocumentFragment = parseFragment<DefaultTreeAdapterMap>(source);
  const tags: ChildNode[] = [];
  let script: string = '';

  fragment.childNodes.forEach((child: ChildNode) => {
    if (child.nodeName === 'script') {
      script += (child.childNodes[0] as TextNode).value;
    } else {
      tags.push(child);
    }
  });

  return { script, tags };
}
