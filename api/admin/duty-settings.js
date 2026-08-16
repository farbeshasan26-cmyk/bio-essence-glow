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

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return null;

  if (!crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    );
  } catch {
    return null;
  }
}

async function supabaseRequest(path, options = {}) {
  const url = process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables missing");
  }

  const response = await fetch(
    `${url}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = null;

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
          data?.hint ||
          data?.details ||
          "Supabase request failed"
    );
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const token = getCookie(req, "session");
    const user = verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: "আপনি Login করা নেই"
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        error: "শুধু Admin এই কাজটি করতে পারবেন"
      });
    }

    const body = req.body || {};

    const dutyHours = Number(body.duty_hours);
    const videoCount = Number(body.video_count);
    const adsPerVideo = Number(body.ads_per_video);
    const rewardPerAd = Number(body.reward_per_ad);
    const videoDurationSeconds = Number(
      body.video_duration_seconds
    );

    if (
      !Number.isFinite(dutyHours) ||
      !Number.isFinite(videoCount) ||
      !Number.isFinite(adsPerVideo) ||
      !Number.isFinite(rewardPerAd) ||
      !Number.isFinite(videoDurationSeconds)
    ) {
      return res.status(400).json({
        error: "Duty-এর তথ্য সঠিক নয়"
      });
    }

    if (
      dutyHours <= 0 ||
      videoCount <= 0 ||
      adsPerVideo <= 0 ||
      rewardPerAd <= 0 ||
      videoDurationSeconds <= 0
    ) {
      return res.status(400).json({
        error: "Duty-এর মান অবশ্যই 0-এর বেশি হতে হবে"
      });
    }

    const totalAds = videoCount * adsPerVideo;
    const totalReward =
      videoCount * adsPerVideo * rewardPerAd;

    const result = await supabaseRequest(
      "duty_settings?on_conflict=duty_hours",
      {
        method: "POST",
        body: JSON.stringify({
          duty_hours: dutyHours,

          // Database-এর আসল column name
          videos_required: videoCount,

          ads_per_video: adsPerVideo,
          reward_per_ad: rewardPerAd,
          video_duration_seconds: videoDurationSeconds,

          // generated column হলেও compatibility-এর জন্য
          // এখানে পাঠানো হচ্ছে না
          active: true,

          updated_at: new Date().toISOString()
        })
      }
    );

    return res.status(200).json({
      ok: true,
      message: `${dutyHours} ঘণ্টার Duty Publish হয়েছে`,
      total_ads: totalAds,
      total_reward: totalReward,
      duty: Array.isArray(result)
        ? result[0]
        : result
    });

  } catch (error) {
    console.error("Duty settings error:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Duty Publish করতে সমস্যা হয়েছে"
    });
  }
}
