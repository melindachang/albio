//
//      /\   | | |   (_)
//     /  \  | | |__  _  ___
//    / /\ \ | | '_ \| |/ _ \
//   / ____ \| | |_) | | (_) |
//  /_/    \_\_|_.__/|_|\___/
//

import { extract, parseFile } from '@parse/body.js';
import { parseCode, walk } from '@parse/script.js';
import { parseHtml } from '@parse/tags.js';
import Renderer from '@core/Renderer.js';

const x = extract(parseFile('./test.html'));
let code = walk(parseCode(x.script));
let doc = parseHtml(x.tags);


let item = new Renderer(doc.nodes, code.props, code.reactives, doc.listeners, code.residuals);
console.log(item.generate());
