import { Props, ReactiveStatement } from '../interfaces';
import { fetch_object, parse } from '../utils';
import { print, x } from 'code-red';
import {
  Identifier,
  Node,
  Statement,
  VariableDeclaration,
  Program,
} from 'estree';
import { Element, Text } from 'domhandler';
import { analyze, extract_names } from 'periscopic';

export function parse_code(scripts: Element[]) {
  let source = '';
  let linkedModules: Element[] = [];

  scripts.forEach((script) => {
    const i = Object.keys(script.attribs).findIndex((key) => key === 'src');
    if (i === -1) {
      source += (script.childNodes[0] as Text).data;
    } else {
      linkedModules.push(script);
    }
  });
  return { source, linkedModules };
}

export function get_program(source: string) {
  const program = parse(source) as any as Program;
  return program;
}

export function extract_scripts(ast: Program) {
  let props: Props = {};
  let reactives: ReactiveStatement[] = [];
  let residuals: Node[] = [];

  ast.body.forEach((node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration':
        (node.declaration as VariableDeclaration).declarations.forEach(
          (declarator) => {
            props[(declarator.id as Identifier).name] = declarator.init
              ? print(x`${declarator.init}`).code
              : undefined;
          },
        );
        break;
      case 'LabeledStatement':
        if (node.label.name === '#') {
          const { scope } = analyze(node);
          reactives.push({ chunk: node.body, deps: [...scope.references] });
        }
        break;
      default:
        residuals.push(node);
    }
  });

  return { props, reactives, residuals };
}
