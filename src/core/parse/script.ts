import { parse } from 'acorn';
import { Identifier, Node, Statement, VariableDeclaration, Program } from 'estree';

export const parseCode = (source: string) => {
  let program = parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  }) as any as Program;

  return program;
};

export const extractScripts = (ast: Program) => {
  let props: Set<string> = new Set();
  let reactives: Statement[] = [];
  let residuals: Node[] = [];

  ast.body.forEach((node) => {
    switch (node.type) {
      case 'ExportNamedDeclaration':
        (node.declaration as VariableDeclaration).declarations.forEach((declarator) => {
          props.add((declarator.id as Identifier).name);
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
};