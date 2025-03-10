import _generate from '@babel/generator';
import { parse } from '@babel/parser';
import _traverse, { type NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { Plugin } from 'vite';

// weird hotfixes for vite.config.ts not properly importing default exports
const traverse: typeof _traverse = (_traverse as any).default ?? _traverse;
const generate: typeof _generate = (_generate as any).default ?? _generate;

/**
 * Vite/Rollup plugin to automatically inject useSignals() call into React components.
 * Generated with Cursor's AI Composer.
 */
export default function injectSignals(options: {
  include?: RegExp | RegExp[];
  exclude?: RegExp | RegExp[];
} = {}): Plugin {
  const include = options.include || /\.[jt]sx$/;
  const exclude = options.exclude || /node_modules/;

  return {
    name: 'vite-plugin-inject-signals',

    transform(code, id) {
      // Skip if file doesn't match include pattern or matches exclude pattern
      if (
        (include instanceof RegExp && !include.test(id)) ||
        (Array.isArray(include) && !include.some(pattern => pattern.test(id))) ||
        (exclude instanceof RegExp && exclude.test(id)) ||
        (Array.isArray(exclude) && exclude.some(pattern => pattern.test(id)))
      ) {
        return null;
      }

      try {
        // Parse the code into an AST
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        let hasReactImport = false;
        let hasSignalsImport = false;
        let hasUseSignalsCall = false;
        let isReactComponent = false;

        // First pass: check if it's a React component and if useSignals is already imported/used
        traverse(ast, {
          ImportDeclaration(path) {
            const source = path.node.source.value;
            if (source === 'react' || source === 'preact') {
              hasReactImport = true;
            }
            if (source === '@preact/signals-react/runtime') {
              const specifier = path.node.specifiers.find(
                spec => t.isImportSpecifier(spec) &&
                       ((t.isIdentifier(spec.imported) && spec.imported.name === 'useSignals') ||
                        spec.local.name === 'useSignals')
              );
              if (specifier) {
                hasSignalsImport = true;
              }
            }
          },
          CallExpression(path) {
            if (
              t.isIdentifier(path.node.callee) &&
              path.node.callee.name === 'useSignals'
            ) {
              hasUseSignalsCall = true;
            }
          },
          FunctionDeclaration(path) {
            // Check if it returns JSX
            path.traverse({
              ReturnStatement(returnPath) {
                if (returnPath.node.argument &&
                    (t.isJSXElement(returnPath.node.argument) ||
                     t.isJSXFragment(returnPath.node.argument))) {
                  isReactComponent = true;
                }
              }
            });
          },
          ArrowFunctionExpression(path) {
            // Check if it returns JSX
            if (t.isJSXElement(path.node.body) || t.isJSXFragment(path.node.body)) {
              isReactComponent = true;
            } else if (t.isBlockStatement(path.node.body)) {
              path.traverse({
                ReturnStatement(returnPath) {
                  if (returnPath.node.argument &&
                      (t.isJSXElement(returnPath.node.argument) ||
                       t.isJSXFragment(returnPath.node.argument))) {
                    isReactComponent = true;
                  }
                }
              });
            }
          }
        });

        // If it's not a React component or already has useSignals, skip
        if (!isReactComponent || !hasReactImport || (hasSignalsImport && hasUseSignalsCall)) {
          return null;
        }

        // Second pass: inject the import and useSignals call
        let bodyPath: NodePath<t.Program> | undefined;
        traverse(ast, {
          Program(path) {
            bodyPath = path;
          }
        });

        if (bodyPath) {
          // Add import if needed
          if (!hasSignalsImport) {
            const importDeclaration = t.importDeclaration(
              [t.importSpecifier(t.identifier('useSignals'), t.identifier('useSignals'))],
              t.stringLiteral('@preact/signals-react/runtime')
            );
            bodyPath.node.body.unshift(importDeclaration);
          }

          // Find all function components and inject useSignals() at the beginning
          traverse(ast, {
            FunctionDeclaration(path) {
              if (isReactComponent) {
                const useSignalsCall = t.expressionStatement(
                  t.callExpression(t.identifier('useSignals'), [])
                );

                if (path.node.body.type === 'BlockStatement') {
                  path.node.body.body.unshift(useSignalsCall);
                }
              }
            },
            ArrowFunctionExpression(path) {
              if (isReactComponent) {
                // Only inject if the body is a block statement
                if (t.isBlockStatement(path.node.body)) {
                  const useSignalsCall = t.expressionStatement(
                    t.callExpression(t.identifier('useSignals'), [])
                  );
                  path.node.body.body.unshift(useSignalsCall);
                }
                // If it's a direct JSX return, convert to block statement
                else if (t.isJSXElement(path.node.body) || t.isJSXFragment(path.node.body)) {
                  const originalBody = path.node.body;
                  path.node.body = t.blockStatement([
                    t.expressionStatement(
                      t.callExpression(t.identifier('useSignals'), [])
                    ),
                    t.returnStatement(originalBody)
                  ]);
                }
              }
            }
          });

          // Generate the modified code
          const output = generate(ast, {}, code);
          return {
            code: output.code,
            map: output.map
          };
        }
      } catch (error) {
        console.error(`Error processing ${id}:`, error);
      }

      return null;
    }
  };
}
