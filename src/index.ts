//
//      /\   | | |   (_)
//     /  \  | | |__  _  ___
//    / /\ \ | | '_ \| |/ _ \
//   / ____ \| | |_) | | (_) |
//  /_/    \_\_|_.__/|_|\___/
//

import { extract, parseFile } from '@core/parse/body';
import { parseCode, walk  } from '@core/parse/script';
import { parseHtml } from '@core/parse/tags';


const x = extract(parseFile('./test.html'));
console.log(walk(parseCode(x.script)));
console.log('=================');
console.log(parseHtml(x.tags));