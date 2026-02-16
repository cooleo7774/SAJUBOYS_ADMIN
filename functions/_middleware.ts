type Env = {
  ADMIN_BASIC_AUTH_USER?: string;
  ADMIN_BASIC_AUTH_PASS?: string;
};

function unauthorizedResponse(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="SajuBoys Admin", charset="UTF-8"',
      "Cache-Control": "no-store"
    }
  });
}

function parseBasicAuthHeader(authorization: string | null): { user: string; pass: string } | null {
  if (!authorization || !authorization.startsWith("Basic ")) {
    return null;
  }

  const encoded = authorization.slice("Basic ".length).trim();
  if (!encoded) {
    return null;
  }

  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return null;
  }

  return {
    user: decoded.slice(0, separatorIndex),
    pass: decoded.slice(separatorIndex + 1)
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const expectedUser = context.env.ADMIN_BASIC_AUTH_USER?.trim();
  const expectedPass = context.env.ADMIN_BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return new Response("Admin auth is not configured", { status: 503 });
  }

  const creds = parseBasicAuthHeader(context.request.headers.get("Authorization"));
  if (!creds) {
    return unauthorizedResponse();
  }

  if (creds.user !== expectedUser || creds.pass !== expectedPass) {
    return unauthorizedResponse();
  }

  return context.next();
};
