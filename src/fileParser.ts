import { parseFragment } from 'parse5';
import { readFileSync } from 'fs';

const FileParser = {
  readFile(path: string) {
    const source: string = readFileSync(path, { encoding: 'utf8' });
    const documentFragment: any = parseFragment(source);

    return this.extract(documentFragment);
  },

  extract(fragment: any) {
    const tags: any[] = [];
    let code: string = '';
    fragment.childNodes.forEach((node: any) => {
      if (node.nodeName === 'script') {
        const index = node.attrs.findIndex(
          (attr: { name: string; value: string | boolean }) => attr.name === 'src',
        );
        if (!(index === -1)) {
          const path: string = node.attrs[index].value;
          code += readFileSync(path); // Parse JS files that <script> tags link to
        } else {
          code += node.childNodes[0].value; // Parse simple JS content of <script> tags
        }
      } else {
        tags.push(node); // Add non-script nodes to list of tags in the document
      }
    });

    return { code, tags };
  },
};

export default FileParser;
