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
        const componentPaths = new Set<NodePath<t.ArrowFunctionExpression | t.FunctionDeclaration>>();

        // Helper function to check if a node returns JSX
        const checkReturnsJSX = (path: NodePath) => {
          let returnsJSX = false;
          path.traverse({
            ReturnStatement(returnPath) {
              if (returnPath.node.argument &&
                  (t.isJSXElement(returnPath.node.argument) ||
                   t.isJSXFragment(returnPath.node.argument))) {
                returnsJSX = true;
              }
            }
          });
          return returnsJSX;
        };

        // Helper function to add component if it returns JSX
        const addComponentIfValid = (path: NodePath<t.ArrowFunctionExpression | t.FunctionDeclaration>) => {
          if (checkReturnsJSX(path)) {
            componentPaths.add(path);
          }
        };

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
            const callee = path.node.callee;
            if (t.isIdentifier(callee) && callee.name === 'useSignals') {
              hasUseSignalsCall = true;
            }
            // Handle any function call that takes a component function as an argument
            else {
              // Look through arguments to find any that are functions returning JSX
              path.node.arguments.forEach((arg, index) => {
                if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
                  const funcPath = path.get(`arguments.${index}`) as NodePath<t.ArrowFunctionExpression>;
                  addComponentIfValid(funcPath);
                }
              });
            }
          },
          FunctionDeclaration(path) {
            // Only consider top-level function declarations or named/default exports
            const parentType = path.parentPath?.type;
            if (parentType === 'Program' || parentType === 'ExportNamedDeclaration' || parentType === 'ExportDefaultDeclaration') {
              addComponentIfValid(path);
            }
          },
          VariableDeclarator(path) {
            // Check for component definitions like: const MyComponent = () => { ... }
            const parentDecl = path.findParent(p => t.isVariableDeclaration(p.node));
            const parentType = parentDecl?.parentPath?.type;
            const isTopLevel = parentType === 'Program' || parentType === 'ExportNamedDeclaration' || parentType === 'ExportDefaultDeclaration';

            if (isTopLevel) {
              const init = path.node.init;
              // Handle direct arrow/function expressions
              if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) {
                const initPath = path.get('init');
                if (!Array.isArray(initPath) && (t.isArrowFunctionExpression(initPath.node) || t.isFunctionExpression(initPath.node))) {
                  addComponentIfValid(initPath as NodePath<t.ArrowFunctionExpression>);
                }
              }
              // Handle HOC wrapped components
              else if (t.isCallExpression(init)) {
                init.arguments.forEach((arg, index) => {
                  if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
                    const funcPath = path.get(`init.arguments.${index}`) as NodePath<t.ArrowFunctionExpression>;
                    addComponentIfValid(funcPath);
                  }
                });
              }
            }
          },
          ExportDefaultDeclaration(path) {
            const declaration = path.node.declaration;
            // Handle direct function or arrow function exports
            if (t.isArrowFunctionExpression(declaration) || t.isFunctionExpression(declaration)) {
              const declPath = path.get('declaration') as NodePath<t.ArrowFunctionExpression>;
              addComponentIfValid(declPath);
            }
            // Handle HOC wrapped components in default exports
            else if (t.isCallExpression(declaration)) {
              declaration.arguments.forEach((arg, index) => {
                if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
                  const funcPath = path.get(`declaration.arguments.${index}`) as NodePath<t.ArrowFunctionExpression>;
                  addComponentIfValid(funcPath);
                }
              });
            }
          }
        });

        // If no React components found or already has useSignals, skip
        if (componentPaths.size === 0 || !hasReactImport || (hasSignalsImport && hasUseSignalsCall)) {
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

          // Inject useSignals() only into component-level functions
          for (const componentPath of componentPaths) {
            const node = componentPath.node;
            if (t.isArrowFunctionExpression(node)) {
              // Handle arrow functions
              if (t.isBlockStatement(node.body)) {
                const useSignalsCall = t.expressionStatement(
                  t.callExpression(t.identifier('useSignals'), [])
                );
                node.body.body.unshift(useSignalsCall);
              } else if (t.isJSXElement(node.body) || t.isJSXFragment(node.body)) {
                const originalBody = node.body;
                node.body = t.blockStatement([
                  t.expressionStatement(
                    t.callExpression(t.identifier('useSignals'), [])
                  ),
                  t.returnStatement(originalBody)
                ]);
              }
            } else if (t.isFunctionDeclaration(node) && node.body.type === 'BlockStatement') {
              // Handle function declarations
              const useSignalsCall = t.expressionStatement(
                t.callExpression(t.identifier('useSignals'), [])
              );
              node.body.body.unshift(useSignalsCall);
            }
          }

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
