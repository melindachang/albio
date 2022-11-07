/*
     /\   | | |   (_)      
    /  \  | | |__  _  ___  
   / /\ \ | | '_ \| |/ _ \ 
  / ____ \| | |_) | | (_) |
 /_/    \_\_|_.__/|_|\___/
*/

import { readFileSync } from 'fs';
import acorn from 'acorn';
import { parseFragment } from 'parse5';

export const readFile = (path: string) => {
  let source: string = readFileSync(path, { encoding: 'utf8' });
  const fragment = parseFragment(source); // Returns DocumentFragment (document object comprised of nodes) to be parsed based on contents of stringified HTML

  return extract(fragment);
};

export const extract = (fragment: any) => {
  // Extracts nodes and logic from DocumentFragment. Returns an object consisting of all logic condensed in one string + all tags arranged in a list
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
};
// SCRIPT PARSER

export const parseScript = (source: string) => { // NOTE: AST can be assigned to a template that is populated correctly by acorn - see acorn.ts
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

// TAG PARSER

console.log(readFile('./test.html'));
console.log(parseScript(readFile('./test.html').code));
