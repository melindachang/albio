//
//      /\   | | |   (_)      
//     /  \  | | |__  _  ___  
//    / /\ \ | | '_ \| |/ _ \ 
//   / ____ \| | |_) | | (_) |
//  /_/    \_\_|_.__/|_|\___/
//

import { extract } from '@/core/parse/body';
import { parseHtml } from '@/core/parse/tags';

const x = extract('./test.html');

console.log(parseHtml(x.tags));