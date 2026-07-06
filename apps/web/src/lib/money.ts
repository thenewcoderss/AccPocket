export function roundMoney(value: number) {
  if (!Number.isFinite(value)) throw new Error("Invalid monetary result");
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculate(left: number, operator: string, right: number) {
  const result = operator === "+" ? left + right : operator === "−" ? left - right : operator === "×" ? left * right : operator === "÷" ? left / right : NaN;
  return roundMoney(result);
}
