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

async function getSupabase(path) {
  const url = process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables missing");
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    }
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message ||
          data?.details ||
          "Supabase request failed"
    );
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const session = getCookie(req, "session");

    if (!session) {
      return res.status(401).json({
        error: "Login required"
      });
    }

    const duties = await getSupabase(
      "duty_settings?select=duty_hours,video_count,ads_per_video,reward_per_ad,video_duration_seconds,total_ads,total_reward&order=duty_hours.asc"
    );

    return res.status(200).json({
      ok: true,
      duties: Array.isArray(duties) ? duties : []
    });

  } catch (error) {
    console.error("Duty GET error:", error);

    return res.status(500).json({
      error: error.message || "Duty load failed"
    });
  }
}
