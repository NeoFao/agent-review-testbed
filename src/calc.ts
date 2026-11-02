export function evaluate(expression: string): number {
  const result: unknown = eval(expression);
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error(`not a finite number: ${expression}`);
  }
  return result;
}
