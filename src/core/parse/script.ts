import { parse } from 'acorn';
import { Program, Node, VariableDeclaration, Identifier } from 'estree';

export const parseCode = (source: string) => {
  let ast = parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  }) as any as Program;

  return ast;
}

export const walk = (ast: Program) => {
  const properties: string[] = [];
  const residualNodes: Node[] = [];

  ast.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      (node.declaration as VariableDeclaration).declarations.forEach((declarator) => {
        properties.push((declarator.id as Identifier).name);
      });
    } else {
      residualNodes.push(node);
    }
  });
  return { properties, residualNodes };
}
