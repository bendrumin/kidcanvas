#!/usr/bin/env bash
# Creates the live-mode KidCanvas Pro product and its two prices, which only
# ever existed in test mode, so Pro checkout on kidcanvas.app has nothing real
# to charge against. Prints the price ids to put in Vercel.
set -euo pipefail

# Print Stripe's own error instead of a KeyError when a call is refused.
id_of() {
  python3 -c 'import json,sys
d=json.load(sys.stdin)
if "id" not in d:
    sys.exit("Stripe said: " + json.dumps(d.get("error", d), indent=2))
print(d["id"])'
}

product=$(stripe products create --live \
  --name "KidCanvas Pro" \
  --description "Unlimited artworks, child profiles, and families." \
  | id_of)

monthly=$(stripe prices create --live --product "$product" \
  --unit-amount 999 --currency usd -d "recurring[interval]=month" \
  | id_of)

yearly=$(stripe prices create --live --product "$product" \
  --unit-amount 9999 --currency usd -d "recurring[interval]=year" \
  | id_of)

echo "Live product:            $product"
echo "STRIPE_PRO_PRICE_ID=$monthly"
echo "STRIPE_PRO_YEARLY_PRICE_ID=$yearly"
echo
echo "Set those two in Vercel (Production) and redeploy:"
echo "  vercel env add STRIPE_PRO_PRICE_ID production"
echo "  vercel env add STRIPE_PRO_YEARLY_PRICE_ID production"
