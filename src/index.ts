import type { StrategyVerifyCallback } from "remix-auth";
import { AuthorizationError } from "remix-auth";
import {
  OAuth2Profile,
  OAuth2Strategy,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

export interface PatreonStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: PatreonScope[] | string;
  authorizationURL?: string;
  tokenURL?: string;
  userIdentityURL?: string;
}

/**
 * @see https://docs.patreon.com/?javascript#scopes
 */
export type PatreonScope =
  | "identity"
  | "identity[email]"
  | "identity.memberships"
  | "campaigns"
  | "w:campaigns.webhook"
  | "campaigns.members"
  | "campaigns.members[emails]"
  | "campaigns.members.address"
  | "campaign.posts";

export interface PatreonIdentity extends OAuth2Profile {
  id: string;
  type: string;
  relationships: {
    campaign: {
      data: {
        id: string;
        type: string;
      };
      links: {
        related: string;
      };
    };
    memberships: {
      data: {
        id: string;
        type: string;
      }[];
    };
  };
  attributes: {
    about: string;
    created: string;
    email: string;
    first_name: string;
    full_name: string;
    image_url: string;
    last_name: string;
    social_connections: {
      discord: string | null;
      facebook: string | null;
      google: string | null;
      instagram: {
        scopes: ["user_profile"];
        url: string;
        user_id: string;
      } | null;
      reddit: string | null;
      spotify: string | null;
      spotify_open_access: string | null;
      tiktok: string | null;
      twitch: string | null;
      twitter: {
        url: string;
        user_id: string;
      } | null;
      vimeo: string | null;
      youtube: {
        scopes: ["https://www.googleapis.com/auth/youtube.readonly"];
        url: string;
        user_id: string;
      } | null;
    };
    thumb_url: string;
    url: string;
    vanity: string;
  };
}

export interface PatreonExtraParams
  extends Record<string, string | number | null> {
  tokenType: string;
  accessTokenExpiresIn: number | null;
  refreshTokenExpiresIn: number | null;
}

export const PatreonStrategyDefaultName = "patreon";
export const PatreonStrategyDefaultScope: PatreonScope = "identity[email]";
export const PatreonStrategyScopeSeparator = " ";

export class PatreonStrategy<User> extends OAuth2Strategy<
  User,
  PatreonIdentity,
  PatreonExtraParams
> {
  name = PatreonStrategyDefaultName;

  private scope: PatreonScope[];
  private userIdentityURL: string;

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      userIdentityURL = "https://www.patreon.com/api/oauth2/v2/identity",
      authorizationURL = "https://www.patreon.com/oauth2/authorize",
      tokenURL = "https://www.patreon.com/api/oauth2/token",
    }: PatreonStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<PatreonIdentity, PatreonExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL,
        tokenURL,
      },
      verify
    );
    this.scope = this.getScope(scope);
    this.userIdentityURL = userIdentityURL;
  }

  //Allow users the option to pass a scope string, or typed array
  private getScope(scope: PatreonStrategyOptions["scope"]) {
    if (!scope) {
      return [PatreonStrategyDefaultScope];
    } else if (typeof scope === "string") {
      return scope.split(PatreonStrategyScopeSeparator) as PatreonScope[];
    }

    return scope;
  }

  protected authorizationParams() {
    return new URLSearchParams({
      scope: this.scope.join(PatreonStrategyScopeSeparator),
    });
  }

  protected async userIdentity(accessToken: string): Promise<PatreonIdentity> {
    let response = await fetch(this.userIdentityURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // let data: PatreonIdentity["attributes"] = await response.json();

    // let profile: PatreonIdentity = {};

    // return profile;

    return await response.json();
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: PatreonExtraParams;
  }> {
    let data = new URLSearchParams(await response.text());

    let accessToken = data.get("access_token");
    if (!accessToken) throw new AuthorizationError("Missing access token.");

    let tokenType = data.get("token_type");
    if (!tokenType) throw new AuthorizationError("Missing token type.");

    let refreshToken = data.get("refresh_token") ?? "";
    let accessTokenExpiresIn = parseExpiresIn(data.get("expires_in"));
    let refreshTokenExpiresIn = parseExpiresIn(
      data.get("refresh_token_expires_in")
    );

    return {
      accessToken,
      refreshToken,
      extraParams: {
        tokenType,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
      },
    } as const;
  }
}

function parseExpiresIn(value: string | null): number | null {
  if (!value) return null;

  try {
    return Number.parseInt(value, 10);
  } catch {
    return null;
  }
}
