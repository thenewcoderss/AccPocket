import { describe, expect, it } from "vitest";
import { deleteTitleConfirmation, filterTitles, transactionDisplayTitle, type TransactionTitle } from "./Transactions";

const title = (id: string, categoryId: string, isActive = true): TransactionTitle => ({ id, categoryId, isActive, name: id, type: "EXPENSE", category: { id: categoryId, name: categoryId, type: "EXPENSE" }, _count: { transactions: 0 } });

describe("transaction title category filtering", () => {
  it("shows only active Utility titles for Utility", () => {
    const rows = [title("Gas bill", "utility"), title("WASA bill", "utility"), title("Restaurant", "food"), title("Old bill", "utility", false)];
    expect(filterTitles(rows, "utility").map(row => row.name)).toEqual(["Gas bill", "WASA bill"]);
  });
  it("clears the options when no category is selected", () => expect(filterTitles([title("Gas bill", "utility")], "")).toEqual([]));
});

describe("transaction title removal UI", () => {
  it("explains that deleting a used title archives it", () => {
    const used = { ...title("Gas bill", "utility"), _count: { transactions: 2 } };
    expect(deleteTitleConfirmation(used)).toContain("archived instead");
    expect(deleteTitleConfirmation(used)).toContain("Historical transactions");
  });
  it("explains that deleting an unused title is permanent", () => expect(deleteTitleConfirmation(title("Draft", "utility"))).toContain("Permanently delete"));
  it("keeps displaying an archived title on a historical transaction", () => {
    expect(transactionDisplayTitle({ description: "Utility payment", transactionTitle: { id: "gas", name: "Gas bill", isActive: false } })).toBe("Gas bill");
  });
});
