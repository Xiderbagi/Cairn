# Roadmap

## Next: launch blockers

1. **Verify the tax tables.** Clear every bolded row in [TAX_REFERENCE.md](TAX_REFERENCE.md).
2. **Store receipt images.** Upload the photo to the private `receipts` bucket (the schema and policies
   already exist) and link it from `transactions.receipt_path`. The CRA asks for records to be kept six years.
3. **Edit entries.** Today an entry can only be deleted.
4. **Onboarding.** On first sign-in, ask for province, GST/HST status and other income before showing the overview.
5. **Legal.** Terms of service, a privacy policy that covers PIPEDA and Quebec's Law 25, and a
   "not tax advice" notice.

## Bank feeds (Flinks)

Flinks is Canadian and covers the big five banks plus credit unions.

- Use Flinks Connect (an iframe) to link accounts, then store the `loginId` per user in a new
  `bank_connections` table with row-level security.
- Pull transactions nightly with a Supabase scheduled function into a `bank_transactions` staging table.
- Suggest a T2125 category for each one (rules first, then Claude for the rest) and let the user confirm
  it into `transactions`, keeping a link to the bank transaction to avoid duplicates.
- Match receipt photos to bank transactions by amount and date.
- Watch for Canada's consumer-driven banking framework, which may offer a cheaper route later.

## Billing (Stripe)

- Plans: Solo (about $15/month), and Business (about $40/month) with bank feeds and an accountant view.
- Stripe Checkout and Customer Portal; a webhook route updates a `subscriptions` table.
- Gate bank feeds and receipt reading on plan in server actions, not only in the UI.
- Charge GST/HST on subscriptions (Stripe Tax supports Canadian provinces).

## Later

- Accountant access: invite an accountant with read-only access to a client's books
- French interface, for Quebec and New Brunswick
- GST/HST return filing through the CRA's GST/HST NETFILE
- Mobile app (Expo) reusing `src/lib/tax`
- Invoicing that records income and GST/HST charged automatically
