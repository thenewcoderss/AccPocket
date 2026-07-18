import { describe, expect, it } from "vitest";
import { filterTitles, type TransactionTitle } from "./Transactions";

const title = (id: string, categoryId: string, isActive = true): TransactionTitle => ({ id, categoryId, isActive, name: id, type: "EXPENSE", category: { id: categoryId, name: categoryId, type: "EXPENSE" }, _count: { transactions: 0 } });

describe("transaction title category filtering", () => {
  it("shows only active Utility titles for Utility", () => {
    const rows = [title("Gas bill", "utility"), title("WASA bill", "utility"), title("Restaurant", "food"), title("Old bill", "utility", false)];
    expect(filterTitles(rows, "utility").map(row => row.name)).toEqual(["Gas bill", "WASA bill"]);
  });
  it("clears the options when no category is selected", () => expect(filterTitles([title("Gas bill", "utility")], "")).toEqual([]));
});
