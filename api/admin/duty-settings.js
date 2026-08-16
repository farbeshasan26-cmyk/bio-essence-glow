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

  if (signature.length !== expected.length) {
    return null;
  }

  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) {
      return null;
    }
  } catch {
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

function getSupabaseKey() {
  /*
    আপনার Vercel Environment Variables অনুযায়ী
    SUPABASE_SECRET_KEY-কে প্রথম priority দেওয়া হয়েছে।
  */

  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    null
  );
}

async function supabaseRequest(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url) {
    throw new Error(
      "SUPABASE_URL পাওয়া যায়নি"
    );
  }

  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY পাওয়া যায়নি"
    );
  }

  const response = await fetch(
    `${url}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",

        /*
          Existing duty_hours row থাকলে update করবে,
          না থাকলে নতুন row তৈরি করবে।
        */
        Prefer:
          "resolution=merge-duplicates,return=representation",

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
    const errorMessage =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.hint ||
          data?.details ||
          data?.error ||
          "Supabase request failed";

    throw new Error(errorMessage);
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
    /*
      ==============================
      ADMIN LOGIN CHECK
      ==============================
    */

    const sessionToken =
      getCookie(req, "session");

    const user =
      verifyToken(sessionToken);

    if (!user) {
      return res.status(401).json({
        error: "আপনি Login করা নেই"
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        error:
          "শুধু Admin এই কাজটি করতে পারবেন"
      });
    }


    /*
      ==============================
      READ REQUEST
      ==============================
    */

    const body = req.body || {};

    const dutyHours =
      Number(body.duty_hours);

    const videoCount =
      Number(
        body.video_count ??
        body.videos_required
      );

    const adsPerVideo =
      Number(body.ads_per_video);

    const rewardPerAd =
      Number(body.reward_per_ad);

    const videoDurationSeconds =
      Number(
        body.video_duration_seconds
      );


    /*
      ==============================
      VALIDATION
      ==============================
    */

    if (
      !Number.isFinite(dutyHours) ||
      !Number.isFinite(videoCount) ||
      !Number.isFinite(adsPerVideo) ||
      !Number.isFinite(rewardPerAd) ||
      !Number.isFinite(videoDurationSeconds)
    ) {
      return res.status(400).json({
        error:
          "Duty-এর তথ্য সঠিক নয়"
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
        error:
          "Duty-এর সব মান 0-এর বেশি হতে হবে"
      });
    }


    /*
      ==============================
      CALCULATE
      ==============================
    */

    const totalAds =
      videoCount * adsPerVideo;

    const totalReward =
      totalAds * rewardPerAd;


    /*
      ==============================
      SAVE / UPDATE DUTY
      ==============================

      duty_hours UNIQUE হলে:
      6 ঘণ্টা আগে থাকলে 6 ঘণ্টারটাই update হবে।
      12 ঘণ্টা আগে থাকলে 12 ঘণ্টারটাই update হবে।

      নতুন হলে নতুন row তৈরি হবে।
    */

    const result =
      await supabaseRequest(
        "duty_settings?on_conflict=duty_hours",
        {
          method: "POST",

          body: JSON.stringify({
            duty_hours: dutyHours,

            video_count: videoCount,

            ads_per_video:
              adsPerVideo,

            reward_per_ad:
              rewardPerAd,

            video_duration_seconds:
              videoDurationSeconds,

            total_ads:
              totalAds,

            total_reward:
              totalReward,

            updated_at:
              new Date().toISOString()
          })
        }
      );


    /*
      ==============================
      SUCCESS
      ==============================
    */

    const savedDuty =
      Array.isArray(result)
        ? result[0]
        : result;

    return res.status(200).json({
      ok: true,

      message:
        `${dutyHours} ঘণ্টার Duty successfully published.`,

      duty:
        savedDuty || {
          duty_hours: dutyHours,
          video_count: videoCount,
          ads_per_video: adsPerVideo,
          reward_per_ad: rewardPerAd,
          video_duration_seconds:
            videoDurationSeconds,
          total_ads: totalAds,
          total_reward: totalReward
        }
    });

  } catch (error) {

    console.error(
      "Duty settings error:",
      error
    );

    return res.status(500).json({
      ok: false,

      error:
        error?.message ||
        "Duty Publish করতে সমস্যা হয়েছে"
    });
  }
}
```
