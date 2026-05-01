import { Auth0Client } from "@auth0/nextjs-auth0/server";

let auth0: Auth0Client | null = null;

export function harAuth0Konfiguration() {
  return Boolean(
    process.env.AUTH0_SECRET &&
      process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET &&
      process.env.APP_BASE_URL,
  );
}

export function hentAuth0() {
  if (!harAuth0Konfiguration()) {
    throw new Error("Auth0 mangler konfiguration.");
  }

  auth0 ??= new Auth0Client();
  return auth0;
}
