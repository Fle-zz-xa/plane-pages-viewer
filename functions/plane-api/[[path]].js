/**
 * Cloudflare Pages Function — CORS proxy for Plane API
 *
 * All requests to /plane-api/* are forwarded to the configured Plane instance.
 * Set PLANE_BASE_URL as an environment variable in the Cloudflare Pages dashboard.
 * Defaults to https://plane.rivetta.eu
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function onRequest(context) {
  const { request, params, env } = context;
  const targetBase = (env.PLANE_BASE_URL || 'https://plane.rivetta.eu').replace(/\/$/, '');

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Build target URL
  const segments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const url = new URL(request.url);
  const targetUrl = `${targetBase}/${segments.join('/')}${url.search}`;

  // Forward only the headers Plane needs
  const forwardHeaders = new Headers();
  const apiKey = request.headers.get('X-Api-Key');
  const contentType = request.headers.get('Content-Type');
  if (apiKey) forwardHeaders.set('X-Api-Key', apiKey);
  if (contentType) forwardHeaders.set('Content-Type', contentType);

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
    });

    const responseBody = await upstream.arrayBuffer();
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy fout', message: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}
