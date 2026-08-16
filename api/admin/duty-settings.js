export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return res.status(500).json({
      error: "Supabase server key is missing"
    });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  if (req.method === "GET") {
    const r = await fetch(
      `${url}/rest/v1/duty_settings?select=*&active=eq.true&order=duty_hours.asc`,
      { headers }
    );

    if (!r.ok) {
      return res.status(500).json({
        error: "Could not load duty settings"
      });
    }

    return res.status(200).json(await r.json());
  }

  if (req.method === "POST") {
    const {
      duty_hours,
      videos_required,
      ads_per_video,
      reward_per_ad,
      video_duration_seconds
    } = req.body || {};

    if (
      !duty_hours ||
      !videos_required ||
      !ads_per_video ||
      !reward_per_ad
    ) {
      return res.status(400).json({
        error: "সব তথ্য দিতে হবে"
      });
    }

    const r = await fetch(`${url}/rest/v1/duty_settings`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        duty_hours,
        videos_required,
        ads_per_video,
        reward_per_ad,
        video_duration_seconds:
          video_duration_seconds || 5400,
        active: true
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        error: data.message || "Duty তৈরি করা যায়নি"
      });
    }

    return res.status(200).json(data[0]);
  }

  return res.status(405).json({
    error: "Method not allowed"
  });
}
