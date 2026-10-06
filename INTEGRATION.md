# Connect this portal to Tigotek

Chosen integration: a separate portal linked from the existing Client Login button at https://www.tigotek.net/.

The live Tigotek website has not been modified. The portal can be connected with a single link change once its hosted address is confirmed.

## Link integration

Set the existing Client Login link destination to the portal's published address:

```html
<a href="https://tigotek-live-office.iratul825.chatgpt.site">Client Login</a>
```

This is a normal top-level navigation and works with the portal's sign-in flow. A private Sites deployment is initially accessible only to its owner. Grant appropriate viewer access through Sites before giving the link to a client. A link by itself does not grant access.

Do not redirect or replace Tigotek's current /login flow if it serves existing clients until those users have been mapped to the new portal. Adding a clearly labelled portal link alongside the existing login is a safe initial rollout.

## Custom domain or self-hosting

A future portal.tigotek.net address requires access to the domain's DNS and hosting configuration. No DNS records have been changed.

For self-hosting, deploy the generated `dist/client` assets and `dist/server/index.js` Worker, provision D1 and R2, apply the generated migration, and supply a trusted authentication adapter. The existing Sites access boundary cannot be assumed on another host. The local preview identity is only for loopback development and must never be used in production.

For integration into an existing Next.js repository, copy the portal components, model, hook, styles and public assets into that repository, resolve the `@/` imports, mount the Portal component at the desired route, and implement equivalent API endpoints behind that site's server session. The standalone app/page.tsx demonstrates the component entrypoint. Authentication must be checked on every API operation.

## Connect real staging

Use the Vercel preview link field below the live office or in Staging to save an HTTPS preview address and an optional progress update. The shared review space stores the link, update, comments, replies, and resolution status in D1. Every authenticated visitor admitted by the Site's access policy can read it and post comments or replies. The first person to save a preview becomes its manager; only that identity can update the link and resolve or reopen comments. Invite the client through Sites sharing before sending the copied client review link. Copying the link does not change access.

The preview server must allow the portal's origin in its Content-Security-Policy frame-ancestors policy and must not block it with X-Frame-Options. Open Full Preview remains available for sites that cannot be embedded or require their own sign-in. The portal cannot bypass deployment protection. General feedback works without changes to the Vercel app. Each comment keeps the reviewed URL, page or section, device, author, and timestamp. Updating the preview link preserves all previous discussions. A moving deployment alias can still change content behind an old URL; use immutable deployment URLs when exact build history matters. Updates refresh every 15 seconds while visible and when returning to the tab. Progress notes are manual; this does not query Vercel deployment status.

The bundled element-pinning bridge deliberately accepts only its own origin. The included FABRIPASS staging is same-origin, so its pins follow elements across device sizes. A cross-origin staging integration needs an explicitly allowed portal origin on both ends, a ready/handshake message, and matching data-feedback element IDs. Comment mode is disabled for external addresses until that integration exists. Do not replace exact origin checks with a wildcard.

## Before real client onboarding

The preview link and its new client review space are shared across this one Site. Existing tasks, sample progress, demo approvals, demo element pins, and asset vault remain isolated per authenticated visitor. For multiple client projects, implement explicit project membership and per-project review rooms before admitting unrelated clients to the same Site. Connect real task/presence/deployment sources and replace sample materials before presenting the demo project metrics as live project progress.
