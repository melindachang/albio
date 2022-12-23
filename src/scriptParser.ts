import { parse } from 'acorn';

const ScriptParser = {
  parse(source: string) {
    const AST = parse(source, {
      sourceType: 'module',
      ecmaVersion: 12,
      locations: true,
    });

    return this.walk(AST);
  },

  walk(AST: any) {
    const props: any = [];
    const rest: any = [];

    AST.body.forEach((declaration: any) => {
      if (declaration.type === 'ExportNamedDeclaration') {
        this.addExport(props, declaration.declaration);
      } else {
        rest.push(declaration);
      }
    });

    return { props, rest };
  },

  addExport(props: any, variableDeclaration: any) {
    variableDeclaration.declarations.forEach((decl: any) => {
      props.push(decl.id.name);
    });
  },
};

export default ScriptParser;
