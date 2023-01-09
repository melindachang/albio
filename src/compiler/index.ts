//
//      /\   | | |   (_)
//     /  \  | | |__  _  ___
//    / /\ \ | | '_ \| |/ _ \
//   / ____ \| | |_) | | (_) |
//  /_/    \_\_|_.__/|_|\___/
//

import { extractFragment, parseFile } from './parse/body.js';
import { parseCode, extractScripts } from './parse/script.js';
import { parseHtml } from './parse/tags.js';
import Renderer from './Renderer.js';
import { print } from 'code-red';
import { Node } from 'estree';

const x = extractFragment(parseFile('./test.html'));
let code: any = extractScripts(parseCode(x.script));
let doc = parseHtml(x.tags);

let item = new Renderer(doc.nodes, code.props, code.reactives, doc.listeners, code.residuals);
console.log(print(item.generate() as any as Node).code);
