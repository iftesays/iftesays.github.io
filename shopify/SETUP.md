# Shopify setup: Holdfast knee pads

This is the store build from the video, done as a checklist. The landing page in this repo (`index.html`) is the product page you send ad traffic to. Shopify handles checkout, payments, order emails, and fulfillment (through Zendrop).

## 1. Create the store (≈15 min)

1. Sign up at shopify.com and pick the **Basic** plan. You won't need a higher plan until you're doing serious volume. Skip POS.
2. **Settings → Store details:** set the store name to `Holdfast` (or your final brand name) and the currency to USD.
3. **Settings → Policies:** generate the Refund, Shipping, Privacy and Terms policies. Edit the refund policy so it matches the 30-day guarantee on the landing page.
4. **Settings → Payments:** turn on Shopify Payments and add PayPal.
5. **Settings → Shipping and delivery:** create a free shipping rate for the US. The landing page promises free US shipping, and the margin math below already includes shipping in cost.

## 2. Install fulfillment: Zendrop

1. Install **Zendrop** from the Shopify App Store and start the trial.
2. In Zendrop, go to **Find Products**, search `anti-slip work knee pads`, and pick the listing closest to the brief: hard cap, gel cushion, two straps, silicone/anti-slip lining. The video found one at about $4.62.
3. **Add to my products**, then edit it before you publish:
   - Title: `Holdfast Anti-Slip Work Knee Pads`
   - Keep only the **Black** variant.
   - Price: **$64.99**.
4. **Publish to my store**.
5. In Zendrop settings, turn on **Auto-fulfill** and add funds/credit card. Orders don't ship unless the Zendrop balance can pay for them.

## 3. Set up the product in Shopify

Open the product Zendrop created (**Products → Holdfast Anti-Slip Work Knee Pads**):

1. Paste `shopify/product-description.html` into the description (use the `<>` HTML view).
2. Add a **Pack** option with two variants:

   | Variant | Price | Compare-at | What Zendrop ships |
   |---|---|---|---|
   | 1 Pair | $64.99 | none | 1 unit |
   | 2 Pairs | $109.99 | $129.98 | 2 units (map the variant to quantity 2 in Zendrop) |

3. Set **Status: Active** and make sure **Online Store** is checked under Sales channels.
4. **Archive** any demo products a theme or app added. You're selling one product.
5. Copy each variant ID: click the variant and take the number at the end of the URL (`…/variants/45678901234567`).

## 4. Connect this landing page to checkout

Edit `assets/config.js`:

```js
shopDomain: "your-store.myshopify.com",
offers: [
  { id: "single", ..., variantId: "<1 Pair variant ID>" },
  { id: "double", ..., variantId: "<2 Pairs variant ID>" }
],
supportEmail: "support@yourdomain.com"
```

Commit and push. GitHub Pages redeploys, and the buy buttons now go straight to Shopify checkout with the selected pack in the cart. UTM parameters from your ad links get passed through to checkout.

**Test before running ads:** turn on Shopify's test mode (Settings → Payments → Bogus Gateway, or Shopify Payments test mode) and place one order for each pack. Check that both orders show up in Zendrop.

## 5. Optional: use your own domain

- Buy a domain (e.g. through Shopify, Settings → Domains).
- Point the root/`www` at GitHub Pages for the landing page, and a subdomain such as `shop.` at Shopify for checkout. Or move the landing page into a Shopify page with a custom template if you'd rather keep everything on Shopify.

## 6. Pixel and tracking

- Install the **Facebook & Instagram** app in Shopify and connect your Meta pixel and Conversions API. That tracks purchases on the Shopify checkout.
- To track landing-page views and Add to Cart too, add the Meta pixel base code to `index.html` `<head>` and fire `fbq('track','InitiateCheckout')` in the `buy()` function in `assets/store.js`.

## 7. The Holdfast theme

`theme/` is a custom Shopify theme built for this brand: a clean workwear-store layout (Barlow type, white and warm-gray sections, restrained motion).

- **Homepage:** hero, trust bar, featured product with pack selector, a draggable before/after slider ("Why they don't slide down"), clickable feature hotspots ("How they're built"), a trades carousel, a comparison table, a 30-day returns banner, reviews (hidden until you add real ones) and FAQ.
- **Product page:** image gallery with thumbnails, swipe and arrows; pack cards with per-pair price and dollar savings; Shop Pay installments line; quantity; Add to cart and Buy it now; collapsible Description, Fit & sizing, Shipping & returns; a sticky add-to-cart bar; then the slider, hotspots, comparison, reviews and FAQ.
- **Slide-out cart** with a one-click "switch to 2 Pairs" offer.
- About, FAQ and Contact templates, collection, search, cart, blog, customer accounts, 404, password and gift card pages.

**Photos:** until you add photos, every image slot shows a technical line drawing of the pad. Add product photos in Shopify (Products → the knee pads → Media) and the gallery, cards and cart switch to them automatically. Hero, before/after slider, hotspots, image-with-text and trade cards each have an image setting in the theme editor.

**Reviews:** the reviews section renders nothing until you add a review block. Only add real customer reviews, or install a reviews app (Judge.me, Shopify Product Reviews).

**Policies:** create Refund and Shipping policies in Settings → Policies (Shopify can generate them). Make the refund policy match the 30-day returns promise on the site. Right now the "How returns work" buttons point to the FAQ page because those policies don't exist yet.

Everything is editable in **Online Store → Themes → Customize**: text, colors (Theme settings → Colors), the cart upgrade offer (Theme settings → Cart), and every section can be reordered, hidden or duplicated.

To update the theme after editing files here, zip the contents of `theme/` (`cd theme && zip -r ../shopify/holdfast-theme.zip .`) and upload it, or use the Shopify CLI: `shopify theme push --path theme`.
