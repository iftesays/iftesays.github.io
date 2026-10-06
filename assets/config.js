// Store configuration. This is the only file you need to edit to connect the
// site to your Shopify store.
//
// 1. shopDomain: your store's myshopify domain (Settings → Domains), e.g.
//    "holdfast-kneewear.myshopify.com". Leave it empty until the store exists.
// 2. variants: the numeric variant IDs of the product in Shopify. Open the
//    product in Shopify admin, click a variant, and copy the number at the end
//    of the URL (…/variants/<THIS NUMBER>).
//
// Buy buttons send shoppers to Shopify's hosted checkout using a cart
// permalink (https://<shopDomain>/cart/<variantId>:<qty>), so payments, tax,
// shipping rates and order emails are all handled by Shopify. No API token is
// needed.
window.STORE_CONFIG = {
  brand: "Holdfast",
  shopDomain: "",
  currency: "USD",
  offers: [
    {
      id: "single",
      label: "1 Pair",
      sublabel: "For one tradesperson",
      price: 64.99,
      compareAt: null,
      variantId: "",
      quantity: 1
    },
    {
      id: "double",
      label: "2 Pairs",
      sublabel: "One for the van, one for the bag",
      price: 109.99,
      compareAt: 129.98,
      variantId: "",
      quantity: 1,
      badge: "Best value"
    }
  ],
  // Optional discount code appended to checkout (Shopify applies it on the
  // checkout page). Create it in Shopify first, then put the code here.
  discountCode: "",
  // Shown in the guarantee section and FAQ. Make sure it matches the refund
  // policy you set in Shopify (Settings → Policies).
  guaranteeDays: 30,
  shippingNote: "Free US shipping. Ships in 1–2 business days; delivery 6–10 business days.",
  supportEmail: ""
};
