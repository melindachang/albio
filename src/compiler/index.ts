//
//      /\   | | |   (_)
//     /  \  | | |__  _  ___
//    / /\ \ | | '_ \| |/ _ \
//   / ____ \| | |_) | | (_) |
//  /_/    \_\_|_.__/|_|\___/
//

export * from './parse/index';
export { default as Compiler } from './compile';
export {
  ChildNode,
  ParentNode,
  Element,
  TextNode,
  CommentNode,
} from 'parse5/dist/tree-adapters/default';
