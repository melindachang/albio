import { parse } from 'acorn';
import { Program, Node, VariableDeclaration } from 'estree';

export function parseCode(source: string) {
  let ast: Program;

  ast = parse(source, {
    sourceType: 'module',
    ecmaVersion: 12,
    locations: true,
  }) as any as Program;

  return ast;
}

export function walk(ast: string) {
  const program: Program = parseCode(ast);
  const properties: string[] = [];
  const residualNodes: Node[] = [];

  program.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      let declaration: VariableDeclaration = node.declaration! as VariableDeclaration;
      declaration.declarations.forEach((declarator: any) => {
        properties.push(declarator.id.name);
      });
    } else {
      residualNodes.push(node);
    }
  });
  return { properties, residualNodes };
}
