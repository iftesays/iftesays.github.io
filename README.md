# Holdfast: anti-slip work knee pads

A one-product e-commerce store. The landing page is hosted on GitHub Pages, and checkout and fulfillment run through Shopify + Zendrop.

| File | What it is |
|---|---|
| `index.html` | Product landing page, the page all ad traffic goes to |
| `assets/config.js` | **Edit this.** Shopify domain, variant IDs, prices, guarantee, support email |
| `assets/store.js` | Pack selector and buy buttons (Shopify cart-permalink checkout) |
| `assets/styles.css` | Styles |
| `shopify/SETUP.md` | Step-by-step Shopify + Zendrop setup |
| `shopify/product-description.html` | Product description to paste into Shopify |
| `playbook/LAUNCH-PLAYBOOK.md` | Product brief, margin math, ad angles, UGC scripts, Meta test plan |

## Go live

1. Follow `shopify/SETUP.md` to create the store, import the product through Zendrop, and create the 1-pair and 2-pair variants.
2. Put your `shopDomain` and both `variantId`s in `assets/config.js`, then push.
3. Place a test order for each pack, then start ads following `playbook/LAUNCH-PLAYBOOK.md`.

Until step 2 is done, the buy buttons show a "checkout isn't connected yet" notice instead of sending shoppers anywhere.
