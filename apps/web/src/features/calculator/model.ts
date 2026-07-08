import { calculate } from "../../lib/money";

export const BACKSPACE_KEY = "\u232b";
export const DIVIDE_KEY = "\u00f7";
export const MULTIPLY_KEY = "\u00d7";
export const SUBTRACT_KEY = "\u2212";

export const calculatorKeys = ["C", BACKSPACE_KEY, DIVIDE_KEY, MULTIPLY_KEY, "7", "8", "9", SUBTRACT_KEY, "4", "5", "6", "+", "1", "2", "3", "=", "0", "00", "."] as const;
export type CalculatorKey = (typeof calculatorKeys)[number];

export type CalculatorState = {
  display: string;
  stored: number | null;
  operator: string | null;
  fresh: boolean;
  error: string | null;
};

export const initialCalculatorState: CalculatorState = { display: "0", stored: null, operator: null, fresh: true, error: null };

const operators = new Set<string>(["+", SUBTRACT_KEY, MULTIPLY_KEY, DIVIDE_KEY]);

function isNumberKey(key: string) {
  return /^\d$/.test(key) || key === "00" || key === ".";
}

function normalizeDisplay(value: string) {
  return value === "" || value === "00" ? "0" : value.replace(/^0+(?=\d)/, "");
}

function appendNumber(display: string, key: string, fresh: boolean) {
  if (key === ".") return fresh ? "0." : display.includes(".") ? display : `${display}.`;
  if (fresh) return key === "00" ? "0" : key;
  if (display === "0" && key !== "00") return key;
  if (display === "0" && key === "00") return "0";
  return normalizeDisplay(`${display}${key}`);
}

export function keyboardToCalculatorKey(key: string): CalculatorKey | null {
  const mapped: Record<string, CalculatorKey> = { "/": DIVIDE_KEY, "*": MULTIPLY_KEY, "-": SUBTRACT_KEY, Enter: "=", "=": "=", Escape: "C", Backspace: BACKSPACE_KEY, Delete: "C" };
  const next = mapped[key] ?? key;
  return calculatorKeys.includes(next as CalculatorKey) ? next as CalculatorKey : null;
}

export function calculatorLabel(key: CalculatorKey) {
  if (key === BACKSPACE_KEY) return "Backspace";
  if (key === "C") return "Clear calculator";
  if (key === DIVIDE_KEY) return "Divide";
  if (key === MULTIPLY_KEY) return "Multiply";
  if (key === SUBTRACT_KEY) return "Subtract";
  if (key === "+") return "Add";
  if (key === "=") return "Equals";
  if (key === ".") return "Decimal point";
  if (key === "00") return "Double zero";
  return `Number ${key}`;
}

export function calculatorReducer(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (isNumberKey(key)) return { ...state, display: appendNumber(state.display, key, state.fresh || Boolean(state.error)), fresh: false, error: null };
  if (key === "C") return initialCalculatorState;
  if (key === BACKSPACE_KEY) {
    if (state.error || state.fresh) return { ...state, display: "0", fresh: true, error: null };
    const display = state.display.length > 1 ? state.display.slice(0, -1) : "0";
    return { ...state, display, fresh: display === "0" };
  }
  if (key === "=") {
    if (state.stored === null || !state.operator) return state;
    try {
      return { display: String(calculate(state.stored, state.operator, Number(state.display))), stored: null, operator: null, fresh: true, error: null };
    } catch (error) {
      return { display: error instanceof Error ? error.message : "Calculator error", stored: null, operator: null, fresh: true, error: "Calculator error" };
    }
  }
  if (operators.has(key)) {
    if (state.error) return { ...initialCalculatorState, operator: key };
    if (state.stored !== null && state.operator && !state.fresh) {
      try {
        const result = calculate(state.stored, state.operator, Number(state.display));
        return { display: String(result), stored: result, operator: key, fresh: true, error: null };
      } catch (error) {
        return { display: error instanceof Error ? error.message : "Calculator error", stored: null, operator: null, fresh: true, error: "Calculator error" };
      }
    }
    return { ...state, stored: Number(state.display), operator: key, fresh: true, error: null };
  }
  return state;
}
