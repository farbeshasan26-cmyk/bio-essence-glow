```javascript
import crypto from "crypto";

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";

  for (const part of cookies.split(";")) {
    const item = part.trim();
    const index = item.indexOf("=");

    if (index === -1) continue;

    const key = item.slice(0, index);
    const value = item.slice(index + 1);

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

function verifyToken(token) {
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;

  if (!secret) return null;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const [data, signature] = parts;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    return JSON.parse(
      Buffer.from(
        data,
        "base64url"
      ).toString("utf8")
    );
  } catch {
    return null;
  }
}

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const token =
      getCookie(req, "session");

    const user =
      verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: "আপনি Login করা নেই"
      });
    }

    const url =
      process.env.SUPABASE_URL;

    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!url || !key) {
      return res.status(500).json({
        error:
          "Supabase environment variables missing"
      });
    }

    const response =
      await fetch(
        `${url}/rest/v1/duty_settings` +
        `?select=duty_hours,videos_required,` +
        `ads_per_video,reward_per_ad,` +
        `video_duration_seconds,total_ads,` +
        `total_reward,active` +
        `&active=eq.true` +
        `&order=duty_hours.asc`,
        {
          method: "GET",
          headers: {
            apikey: key,
            Authorization:
              `Bearer ${key}`
          }
        }
      );

    const text =
      await response.text();

    if (!response.ok) {

      return res.status(500).json({
        error:
          text ||
          "Duty load failed"
      });
    }

    const duties =
      text
        ? JSON.parse(text)
        : [];

    return res.status(200).json({
      ok: true,
      duties
    });

  } catch (error) {

    console.error(
      "Duty settings error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Duty load failed"
    });
  }
}
```
