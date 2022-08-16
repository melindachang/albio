/*
     /\   | | |   (_)      
    /  \  | | |__  _  ___  
   / /\ \ | | '_ \| |/ _ \ 
  / ____ \| | |_) | | (_) |
 /_/    \_\_|_.__/|_|\___/
*/

/*
STUFF TO DO
(build the core in one file for now and then extract the logic out later)

- Parse index.html - list of tags/nodes/other stuff to be fed to Acorn and code-red
    - Parse any HTML files explicitly linked to index.html
    - Parse mustache stuff
- Parse the JS file linked in a script tag, or parse any code inside of a script tag in the HTML file 
*/
import { readFileSync } from 'fs';
import acorn from 'acorn';
import { parseFragment } from 'parse5';

export const readFile = (path: string) => {
  let source: string = readFileSync(path, { encoding: 'utf8' });
  const fragment = parseFragment(source);

  return extract(fragment);
};

export const extract = (fragment: any) => {
  const tags: any[] = [];
  let code: string = '';

  fragment.childNodes.forEach((node: any) => {
    if (node.nodeName === 'script') {
      const index = node.attrs.findIndex(
        (attr: { name: string; value: string | boolean }) => attr.name === 'src',
      );
      if (!(index === -1)) {
        const path: string = node.attrs[index].value;
        code += readFileSync(path);
      } else {
        code += node.childNodes[0].value;
      }
    } else {
      tags.push(node);
    }
  });

  return { code, tags };
};

export const parseScript = (source: string) => {
  const AST = acorn.parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  });

  return walk(AST);
};

export const walk = (AST: any) => {
  const rest: any[] = [];

  AST.body.forEach((declaration: any) => {
    rest.push(declaration);
  });

  return { rest };
};
console.log(readFile('./test.html'));
console.log(parseScript(readFile('./test.html').code));
