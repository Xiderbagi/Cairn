import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { getSettings, requireUser } from "@/lib/data";
import { todayIso } from "@/lib/format";
import { PROVINCES, T2125_EXPENSE_LINES } from "@/lib/tax";
import { ReceiptDraftSchema, clampDraft } from "./schema";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT = 8000;

const client = new Anthropic();

function systemPrompt(provinceName: string, rate: number, taxName: string) {
  const lines = Object.entries(T2125_EXPENSE_LINES).map(([code, label]) => `${code} ${label}`).join("\n");
  return `You turn one receipt, invoice or description into a single bookkeeping entry for a Canadian sole proprietor in ${provinceName}, where sales tax is ${rate}% ${taxName}.

Rules:
- "expense" for money the business spent, "income" for money it was paid.
- amount is before sales tax. If only a tax-included total is shown, split it using ${rate}%.
- salesTax is the GST/HST portion only. Provincial sales taxes (PST, QST, RST) are part of the cost: add them to amount.
- If the year is missing, use the most recent past date.
- Pick the closest T2125 line for expenses:
${lines}`;
}

export async function POST(request: Request) {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Receipt reading isn't set up on this server." }, { status: 503 });
  }

  const form = await request.formData();
  const text = String(form.get("text") ?? "").trim().slice(0, MAX_TEXT);
  const file = form.get("receipt");
  const image = file instanceof File && file.size > 0 ? file : null;
  if (!text && !image) return NextResponse.json({ error: "Type a description or attach a receipt first." }, { status: 400 });
  if (image && !IMAGE_TYPES.includes(image.type as (typeof IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP or GIF image." }, { status: 400 });
  }
  if (image && image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "That image is over 5 MB. Try a smaller photo." }, { status: 400 });

  const settings = await getSettings();
  const p = PROVINCES[settings.province];
  const today = todayIso();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: image.type as (typeof IMAGE_TYPES)[number], data: Buffer.from(await image.arrayBuffer()).toString("base64") },
    });
  }
  content.push({ type: "text", text: `Today is ${today}.\n\n${text || "Read the attached receipt."}` });

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(ReceiptDraftSchema) },
      system: systemPrompt(p.name, p.salesTaxRate, p.salesTaxName),
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Claude couldn't read that one. Fill in the form by hand." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return NextResponse.json({ error: "Couldn't read that. Try a clearer photo or a short description." }, { status: 422 });
    }
    return NextResponse.json({ draft: clampDraft(response.parsed_output, today) });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Too many requests just now. Wait a minute and try again." }, { status: 429 });
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Receipt parse rejected", error.message);
      return NextResponse.json({ error: "Couldn't read that file. Try another photo." }, { status: 400 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error", error.status, error.message);
      return NextResponse.json({ error: "Receipt reading is unavailable right now. Fill in the form by hand." }, { status: 502 });
    }
    throw error;
  }
}
