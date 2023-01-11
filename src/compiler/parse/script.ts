import { Props } from '../interfaces';
import { parse } from 'acorn';
import { print, x } from 'code-red';
import { Identifier, Node, Statement, VariableDeclaration, Program } from 'estree';
import { Element, DataNode } from 'domhandler';

export function parseCode(scripts: Element[]) {
  let source = '';
  let linkedModules: Element[];

  scripts.forEach((script) => {
    const i = Object.keys(script.attribs).findIndex((key) => key === 'src');
    if (i === -1) {
      source += (script.childNodes[0] as DataNode).data;
    } else {
      linkedModules.push(script);
    }
  });
  return { source, linkedModules };
}

export function getProgram(source: string) {
  const program = parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  }) as any as Program;
  return program;
}

export function extractScripts(ast: Program) {
  let props: Props = {};
  let reactives: Statement[] = [];
  let residuals: Node[] = [];

  ast.body.forEach((node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration':
        (node.declaration as VariableDeclaration).declarations.forEach((declarator) => {
          props[(declarator.id as Identifier).name] = declarator.init
            ? print(x`${declarator.init}`).code
            : undefined;
        });
        break;
      case 'LabeledStatement':
        if (node.label.name === '$') {
          reactives.push(node.body);
        }
        break;
      default:
        residuals.push(node);
    }
  });

  return { props, reactives, residuals };
}
