//
//      /\   | | |   (_)
//     /  \  | | |__  _  ___
//    / /\ \ | | '_ \| |/ _ \
//   / ____ \| | |_) | | (_) |
//  /_/    \_\_|_.__/|_|\___/
//

import { extract, parseFile } from '@core/parse/body';
import { parseCode, walk } from '@core/parse/script';
import { parseHtml } from '@core/parse/tags';
import { Component } from './component';
import { format } from '@core/utils';

const x = extract(parseFile('./test.html'));
let code = walk(parseCode(x.script));
let doc = parseHtml(x.tags);

let item = new Component(doc.nodes, code.props, doc.eventListeners, code.residualNodes);
let formatted = format(item.create());
console.log(formatted);
