import { describe, expect, it } from "vitest";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ReceiptDraftSchema, clampDraft, type ReceiptDraft } from "./schema";

const draft = (over: Partial<ReceiptDraft>): ReceiptDraft => ({
  type: "expense", date: "2026-10-03", description: "Staples — ink", amount: 76.46, salesTax: 9.94,
  category: "8811", businessUsePct: 100, note: "Office supplies.", ...over,
});

describe("receipt schema", () => {
  it("converts to a structured-output format", () => {
    const format = betaZodOutputFormat(ReceiptDraftSchema);
    expect(format.type).toBe("json_schema");
    expect(JSON.stringify(format.schema)).toContain("8811");
  });

  it("parses a model response", () => {
    const format = betaZodOutputFormat(ReceiptDraftSchema);
    expect(format.parse(JSON.stringify(draft({})))).toMatchObject({ category: "8811" });
  });

  it("clamps out-of-range values", () => {
    const d = clampDraft(draft({ date: "Oct 3", amount: -5, salesTax: 1.005, businessUsePct: 140, description: "  " }), "2026-10-25");
    expect(d).toMatchObject({ date: "2026-10-25", amount: 0, businessUsePct: 100, description: "Receipt" });
  });

  it("drops the category on income and defaults it on expenses", () => {
    expect(clampDraft(draft({ type: "income", category: "8810" }), "2026-10-25").category).toBeNull();
    expect(clampDraft(draft({ category: null }), "2026-10-25").category).toBe("9270");
  });
});
