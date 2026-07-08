import { describe, expect, it } from "vitest";
import { BACKSPACE_KEY, calculatorReducer, DIVIDE_KEY, initialCalculatorState, keyboardToCalculatorKey, MULTIPLY_KEY, SUBTRACT_KEY } from "./model";

function press(keys: string[]) {
  return keys.reduce((state, key) => calculatorReducer(state, key as never), initialCalculatorState);
}

describe("calculator model", () => {
  it("handles number input, double zero, and one decimal point", () => {
    expect(press(["0", "0", "5"]).display).toBe("5");
    expect(press(["1", "00", ".", "2", ".", "3"]).display).toBe("100.23");
    expect(press(["."]).display).toBe("0.");
  });

  it("calculates the four basic operations", () => {
    expect(press(["1", "2", "+", "3", "="]).display).toBe("15");
    expect(press(["1", "2", SUBTRACT_KEY, "3", "="]).display).toBe("9");
    expect(press(["1", "2", MULTIPLY_KEY, "3", "="]).display).toBe("36");
    expect(press(["1", "2", DIVIDE_KEY, "3", "="]).display).toBe("4");
  });

  it("shows a clear divide-by-zero error that resets on number entry", () => {
    const error = press(["5", DIVIDE_KEY, "0", "="]);
    expect(error.display).toBe("Cannot divide by zero");
    expect(calculatorReducer(error, "7").display).toBe("7");
  });

  it("clears and backspaces safely", () => {
    expect(press(["1", "2", BACKSPACE_KEY]).display).toBe("1");
    expect(press(["1", "C"]).display).toBe("0");
  });

  it("maps keyboard input without touching financial records", () => {
    expect(keyboardToCalculatorKey("/")).toBe(DIVIDE_KEY);
    expect(keyboardToCalculatorKey("*")).toBe(MULTIPLY_KEY);
    expect(keyboardToCalculatorKey("-")).toBe(SUBTRACT_KEY);
    expect(keyboardToCalculatorKey("Backspace")).toBe(BACKSPACE_KEY);
    expect(keyboardToCalculatorKey("a")).toBeNull();
  });
});
