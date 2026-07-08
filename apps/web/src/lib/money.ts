export function roundMoney(value: number) {
  if (!Number.isFinite(value)) throw new Error("Invalid monetary result");
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculate(left: number, operator: string, right: number) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) throw new Error("Invalid number");
  const normalized = operator === "\u2212" ? "-" : operator === "\u00d7" ? "*" : operator === "\u00f7" ? "/" : operator;
  if (normalized === "/" && right === 0) throw new Error("Cannot divide by zero");
  const result = normalized === "+" ? left + right : normalized === "-" ? left - right : normalized === "*" ? left * right : normalized === "/" ? left / right : NaN;
  return roundMoney(result);
}
