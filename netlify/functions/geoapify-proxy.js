const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...corsHeaders, ...extraHeaders },
    body: typeof body === "string" ? body : JSON.stringify(body)
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") return response(204, "");

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return response(500, { error: "Geoapify proxy is not configured" });

  const action = event.queryStringParameters?.action;

  try {
    if (action === "reverse") {
      const lat = Number(event.queryStringParameters?.lat);
      const lon = Number(event.queryStringParameters?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return response(400, { error: "Valid lat and lon are required" });
      }

      const upstream = new URL("https://api.geoapify.com/v1/geocode/reverse");
      upstream.searchParams.set("lat", String(lat));
      upstream.searchParams.set("lon", String(lon));
      upstream.searchParams.set("format", "json");
      upstream.searchParams.set("apiKey", apiKey);

      const result = await fetch(upstream, { method: "GET" });
      const body = await result.text();
      return response(result.status, body, {
        "Content-Type": result.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
    }

    if (action === "mapmatching") {
      if (event.httpMethod !== "POST") return response(405, { error: "Map matching requires POST" });

      const upstream = new URL("https://api.geoapify.com/v1/mapmatching");
      upstream.searchParams.set("apiKey", apiKey);

      const result = await fetch(upstream, {
        method: "POST",
        headers: { "Content-Type": event.headers?.["content-type"] || "application/json" },
        body: event.body || ""
      });
      const body = await result.text();
      return response(result.status, body, {
        "Content-Type": result.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
    }

    return response(400, { error: "Unknown Geoapify proxy action" });
  } catch (error) {
    console.error("Geoapify proxy error", error);
    return response(502, { error: "Geoapify request failed" });
  }
};
