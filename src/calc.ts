// Recursive-descent parser for numbers, + - * / and parentheses. Anything else is rejected.
export function evaluate(expression: string): number {
  const tokens = expression.match(/\d+(?:\.\d+)?|[-+*/()]|\S/g) ?? [];
  let pos = 0;

  const peek = (): string | undefined => tokens[pos];
  const take = (): string | undefined => tokens[pos++];

  function primary(): number {
    const token = take();
    if (token === '(') {
      const value = sum();
      if (take() !== ')') throw new Error('expected )');
      return value;
    }
    if (token === '-') return -primary();
    if (token !== undefined && /^\d/.test(token)) return Number(token);
    throw new Error(`unexpected token: ${token ?? 'end of input'}`);
  }

  function product(): number {
    let value = primary();
    while (peek() === '*' || peek() === '/') {
      value = take() === '*' ? value * primary() : value / primary();
    }
    return value;
  }

  function sum(): number {
    let value = product();
    while (peek() === '+' || peek() === '-') {
      value = take() === '+' ? value + product() : value - product();
    }
    return value;
  }

  const result = sum();
  if (pos !== tokens.length) throw new Error(`unexpected token: ${peek()}`);
  if (!Number.isFinite(result)) throw new Error(`not a finite number: ${expression}`);
  return result;
}
