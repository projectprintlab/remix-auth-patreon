# PatreonStrategy

The Patreon strategy is used to authenticate users against a Patreon account. It extends the OAuth2Strategy.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Usage

### Create an OAuth application

Follow the steps on [the Patreon documentation](https://docs.patreon.com/?javascript#oauth) to create a new application and get a client ID and secret.

### Create the strategy instance

```ts
import { PatreonStrategy } from "remix-auth-patreon";

let patreonStrategy = new PatreonStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/patreon/callback",
  },
  async ({ accessToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    return User.findOrCreate({ email: profile.emails[0].value });
  }
);

authenticator.use(patreonStrategy);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form action="/auth/patreon" method="post">
      <button>Login with Patreon</button>
    </Form>
  );
}
```

```tsx
// app/routes/auth/patreon.tsx
import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export async function loader() {
  return redirect("/login");
}

export async function action({ request }: ActionArgs) {
  return authenticator.authenticate("patreon", request);
}
```

```tsx
// app/routes/auth/patreon/callback.tsx
import type { LoaderArgs } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  return authenticator.authenticate("patreon", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
}
```
