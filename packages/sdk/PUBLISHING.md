# Publishing `@httperror/sighthog` to npm

This package is published under the npm organization **`@httperror`**, owned by the **`kingrain`** account.

You do **not** log in as a user named `httperror`. Log in as **`kingrain`** (or any npm user with **Owner** or **Developer** access on the `@httperror` org).

## One-time check

```bash
npm login
npm whoami              # should print: kingrain
npm org ls httperror    # should list kingrain (and any teammates)
```

If `npm org ls httperror` fails with "Scope not found", create the org at [npmjs.com/org/create](https://www.npmjs.com/org/create) with the name **`httperror`**.

## Publish

```bash
cd packages/sdk
npm run build
npm run publish:public
```

If 2FA is enabled:

```bash
npm publish --access public --otp=123456
```

`publishConfig.access: public` is already set in `package.json`, so scoped packages publish as public.

## Install (for consumers)

```bash
npm install @httperror/sighthog rrweb web-vitals
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Scope not found` | Create the `httperror` org on npm, or fix the org name spelling. |
| `403 Forbidden` | Log in as `kingrain` and confirm you are on the org: `npm org ls httperror`. |
| `OTP required` | Add `--otp=YOUR_CODE`. |
| `402 Payment Required` | Use the free unlimited public packages plan for the org. |

## Add a teammate

Org owners can grant publish access:

```bash
npm org set httperror <username> developer
```
