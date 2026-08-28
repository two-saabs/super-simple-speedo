const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "https://supersimplespeedo.app"
]);

function headersFor(origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}

function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: headersFor(origin),
    body: JSON.stringify(body)
  };
}

function validCoordinate(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

exports.handler = async function handler(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";

  if (event.httpMethod === "OPTIONS") {
    if (!ALLOWED_ORIGINS.has(origin)) return json(403, { error: "Origin not allowed" }, origin);
    return { statusCode: 204, headers: headersFor(origin), body: "" };
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(403, { error: "Origin not allowed" }, origin);
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return json(503, { error: "Road service is not configured" }, origin);

  const action = event.queryStringParameters?.action;

  try {
    if (action === "reverse") {
      if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" }, origin);
      const lat = event.queryStringParameters?.lat;
      const lon = event.queryStringParameters?.lon;
      if (!validCoordinate(lat, -90, 90) || !validCoordinate(lon, -180, 180)) {
        return json(400, { error: "Invalid coordinates" }, origin);
      }

      const upstream = new URL("https://api.geoapify.com/v1/geocode/reverse");
      upstream.searchParams.set("lat", String(Number(lat)));
      upstream.searchParams.set("lon", String(Number(lon)));
      upstream.searchParams.set("format", "json");
      upstream.searchParams.set("apiKey", apiKey);

      const response = await fetch(upstream, { method: "GET" });
      const text = await response.text();
      return {
        statusCode: response.status,
        headers: headersFor(origin),
        body: text
      };
    }

    if (action === "mapmatching") {
      if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" }, origin);
      if (!event.body || event.body.length > 20000) return json(400, { error: "Invalid request body" }, origin);

      let body;
      try {
        body = JSON.parse(event.body);
      } catch {
        return json(400, { error: "Invalid JSON" }, origin);
      }

      if (body?.mode !== "drive" || !Array.isArray(body?.waypoints) || body.waypoints.length < 2 || body.waypoints.length > 10) {
        return json(400, { error: "Invalid map-matching request" }, origin);
      }

      for (const point of body.waypoints) {
        if (!validCoordinate(point?.lat ?? point?.latitude, -90, 90) || !validCoordinate(point?.lon ?? point?.longitude, -180, 180)) {
          return json(400, { error: "Invalid waypoint" }, origin);
        }
      }

      const upstream = new URL("https://api.geoapify.com/v1/mapmatching");
      upstream.searchParams.set("apiKey", apiKey);

      const response = await fetch(upstream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: event.body
      });
      const text = await response.text();
      return {
        statusCode: response.status,
        headers: headersFor(origin),
        body: text
      };
    }

    return json(400, { error: "Unknown action" }, origin);
  } catch (error) {
    console.error("Geoapify proxy error", error);
    return json(502, { error: "Road service temporarily unavailable" }, origin);
  }
};
