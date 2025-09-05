// TypeScript declarations for eval-estree-expression

export interface VariablesOptions {
  withMembers?: boolean;
}

export interface VisitorsMap {
  [nodeType: string]: (node: any, context: any, parent?: any) => any;
}

export interface EvaluateOptions {
  // Behavior
  booleanLogicalOperators?: boolean;
  strict?: boolean;
  regexOperator?: boolean; // defaults true in runtime
  allowContextStringLiterals?: boolean;

  // Complexity limits
  budget?: number;
  maxArrayLength?: number;
  maxExpressionDepth?: number;

  // Function support
  functions?: boolean;
  generate?: (node: any) => string; // escodegen.generate

  // Custom visitors
  visitors?: VisitorsMap;
}

export type Context = Record<string, any> | undefined;

export interface EvaluateFn {
  (tree: any, context?: Context, options?: EvaluateOptions): Promise<any>;
  sync(tree: any, context?: Context, options?: EvaluateOptions): any;
}

export declare class ExpressionSync {
  constructor(tree: any, options?: EvaluateOptions, internalState?: { created?: boolean });

  // Static
  static readonly FAIL: unique symbol;
  static readonly ExpressionSync: typeof ExpressionSync;
  static variables(tree: any, options?: VariablesOptions): string[];
  static evaluate(tree: any, context?: Context, options?: EvaluateOptions): any;

  // Instance
  evaluate(context?: Context): any;
}

export declare class Expression extends ExpressionSync {
  // Static
  static readonly isAsync: true;
  static readonly Expression: typeof Expression;
  static readonly ExpressionSync: typeof ExpressionSync;
  static variables(tree: any, options?: VariablesOptions): string[];
  static evaluate: EvaluateFn;

  // Instance
  evaluate(context?: Context): Promise<any>;
}

export const variables: (tree: any, options?: VariablesOptions) => string[];
export const evaluate: EvaluateFn;

export { Expression, ExpressionSync };
export default Expression;

