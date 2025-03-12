import { type AttachedScope, attachScopes, createFilter } from '@rollup/pluginutils';
import type { ArrowFunctionExpression, BlockStatement, Expression, FunctionDeclaration, FunctionExpression, ReturnStatement } from 'estree';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { ProgramNode, type Plugin } from 'rollup';

declare module 'estree' {
  export interface BaseNode {
    scope?: AttachedScope;
    start: number;
    end: number;
  }
}

const jsxIdents = [
  'jsx',
  'jsxs',
  'jsxDEV',
  'jsxsDEV',
  '_jsx',
  '_jsxs',
  '_jsxDEV',
  '_jsxsDEV',
  'h',
];

/**
 * Vite/Rollup plugin to automatically inject useSignals() call into React components.
 * Generated with Cursor's AI Composer.
 */
export default function preactSignalsTransformer(options: {
  include?: RegExp | RegExp[];
  exclude?: RegExp | RegExp[];
} = {}): Plugin {
  const filter = createFilter(options.include ?? /\.[jt]sx$/, options.exclude ?? /node_modules/);

  return {
    name: 'vite-plugin-preact-signals-transformer',

    transform(code, id) {
      if (!filter(id)) return null;

      let ast: ProgramNode | undefined;
      try {
        ast = this.parse(code, { jsx: true });
      } catch (error) {
        this.warn(`Error parsing ${id}: ${error}`);
      }
      if (!ast) return null;

      const hasImport = ast.body.some(
        node => node.type === 'ImportDeclaration' &&
          node.source.value === '@preact/signals-react/runtime' &&
          node.specifiers.some(
            specifier => specifier.type === 'ImportSpecifier' &&
              specifier.imported.type === 'Identifier' &&
              specifier.imported.name === 'useSignals'
            )
        );

      const components = new Set<FunctionDeclaration | FunctionExpression | ArrowFunctionExpression>();
      const magicString = new MagicString(code);
      let scope = attachScopes(ast, 'scope');

      walk(ast, {
        enter(node) {
          if (node.scope) {
            scope = node.scope;
          }

          switch (node.type) {
            case 'FunctionDeclaration':
            case 'FunctionExpression':
            case 'ArrowFunctionExpression': {
              if (node.body.type === 'BlockStatement') {
                const returnStatements = findReturnStatements(node.body, scope);
                for (const stmt of returnStatements) {
                  console.log(stmt.argument);
                  if (isJsx(stmt.argument)) {
                    components.add(node);
                  }
                }
              }
              break;
            }
          }
        },
        leave(node) {
          if (node.scope) {
            scope = scope.parent!;
          }
        }
      });

      if (!components.size) return null;

      if (!hasImport) {
        magicString.prepend(`import { useSignals } from '@preact/signals-react/runtime';\n`);
      }

      for (const component of components) {
        if (component.body.type !== 'BlockStatement') continue; // shouldn't happen
        magicString.prependLeft(component.body.start+1, '\n\tuseSignals();\n');
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true }),
      };
    },
  };
}

function isJsx(expr: Expression | null | undefined) {
  if (!expr) return false;
  if ((expr.type as string) === 'JSXElement') return true;
  if ((expr.type as string) === 'JSXFragment') return true;
  if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier' && jsxIdents.includes(expr.callee.name)) {
    return true;
  }
  return false;
}

function findReturnStatements(node: BlockStatement, scope: AttachedScope) {
  const result: ReturnStatement[] = [];
  let isHomeScope = true; // Whether the current scope is the home scope

  walk(node, {
    enter(node) {
      switch (node.type) {
        case 'FunctionDeclaration':
          if (!node.scope) throw new Error('FunctionDeclaration has no scope');
          isHomeScope = false;
          break;
        case 'FunctionExpression':
          if (!node.scope) throw new Error('FunctionExpression has no scope');
          isHomeScope = false;
          break;
        case 'ArrowFunctionExpression':
          if (!node.scope) throw new Error('ArrowFunctionExpression has no scope');
          isHomeScope = false;
          break;
        case 'ReturnStatement':
          if (isHomeScope) {
            result.push(node);
          }
          break;
      }
    },
    leave(node) {
      if ('scope' in node) {
        isHomeScope = (node as any).scope.parent === scope;
      }
    },
  });

  return result;
}
