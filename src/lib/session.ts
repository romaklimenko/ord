import { hentAuth0, harAuth0Konfiguration } from "@/lib/auth0";

export type AktuelBruger = {
  id: string;
  navn: string;
  email?: string;
  authKonfigureret: boolean;
  authAktiv: boolean;
};

export function erGæst(bruger: AktuelBruger): boolean {
  return bruger.authKonfigureret && !bruger.authAktiv;
}

export async function hentAktuelBruger(): Promise<AktuelBruger> {
  if (harAuth0Konfiguration()) {
    const session = await hentAuth0().getSession();

    if (session?.user?.sub) {
      return {
        id: session.user.sub,
        navn: session.user.name ?? session.user.email ?? "Bruger",
        email: session.user.email,
        authKonfigureret: true,
        authAktiv: true,
      };
    }

    return {
      id: "anonymous",
      navn: "Ikke logget ind",
      authKonfigureret: true,
      authAktiv: false,
    };
  }

  return {
    id: "dev-user",
    navn: "Lokal bruger",
    authKonfigureret: false,
    authAktiv: false,
  };
}
