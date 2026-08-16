export default async function handler(req, res) {
  // =========================
  // ADMIN AUTHENTICATION
  // =========================

  const cookie = req.headers.cookie || "";

  if (!cookie.includes("admin_session=")) {
    return res.status(401).json({
      error: "আপনি Login করা নেই"
    });
  }

  // =========================
  // SUPABASE
  // =========================

  const url = process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(500).json({
      error: "Supabase environment variables missing"
    });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  try {
    // =========================
    // ONLY POST ALLOWED
    // =========================

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const body = req.body || {};

    const dutyHours = Number(body.duty_hours);
    const videosRequired = Number(
      body.video_count ?? body.videos_required
    );
    const adsPerVideo = Number(body.ads_per_video);
    const rewardPerAd = Number(body.reward_per_ad);
    const videoDurationSeconds = Number(
      body.video_duration_seconds
    );

    // =========================
    // VALIDATION
    // =========================

    if (
      !Number.isFinite(dutyHours) ||
      !Number.isFinite(videosRequired) ||
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
      videosRequired <= 0 ||
      adsPerVideo <= 0 ||
      rewardPerAd <= 0 ||
      videoDurationSeconds <= 0
    ) {
      return res.status(400).json({
        error: "Duty-এর সব তথ্য 0-এর বেশি হতে হবে"
      });
    }

    // =========================
    // CALCULATE TOTALS
    // =========================

    const totalAds =
      videosRequired * adsPerVideo;

    const totalReward =
      totalAds * rewardPerAd;

    // =========================
    // CHECK EXISTING DUTY
    // =========================

    const checkResponse = await fetch(
      `${url}/rest/v1/duty_settings?duty_hours=eq.${encodeURIComponent(
        dutyHours
      )}&select=id,duty_hours`,
      {
        method: "GET",
        headers
      }
    );

    const checkText = await checkResponse.text();

    if (!checkResponse.ok) {
      return res.status(500).json({
        error: "Existing Duty check করা যায়নি",
        details: checkText
      });
    }

    let existing = [];

    try {
      existing = checkText
        ? JSON.parse(checkText)
        : [];
    } catch {
      existing = [];
    }

    // =========================
    // DUTY DATA
    // =========================

    const dutyData = {
      duty_hours: dutyHours,
      videos_required: videosRequired,
      ads_per_video: adsPerVideo,
      reward_per_ad: rewardPerAd,
      video_duration_seconds: videoDurationSeconds,
      active: true
    };

    // =========================
    // UPDATE EXISTING DUTY
    // =========================

    if (existing.length > 0) {
      const dutyId = existing[0].id;

      const updateResponse = await fetch(
        `${url}/rest/v1/duty_settings?id=eq.${encodeURIComponent(
          dutyId
        )}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(dutyData)
        }
      );

      const updateText =
        await updateResponse.text();

      if (!updateResponse.ok) {
        return res.status(500).json({
          error: "Duty update করা যায়নি",
          details: updateText
        });
      }

      let updatedDuty;

      try {
        updatedDuty = updateText
          ? JSON.parse(updateText)
          : [];
      } catch {
        updatedDuty = [];
      }

      return res.status(200).json({
        ok: true,
        message:
          `${dutyHours} ঘণ্টার Duty successfully updated`,
        duty:
          Array.isArray(updatedDuty)
            ? updatedDuty[0]
            : updatedDuty,
        calculation: {
          videos: videosRequired,
          ads_per_video: adsPerVideo,
          total_ads: totalAds,
          reward_per_ad: rewardPerAd,
          total_reward: totalReward
        }
      });
    }

    // =========================
    // CREATE NEW DUTY
    // =========================

    const createResponse = await fetch(
      `${url}/rest/v1/duty_settings`,
      {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify(dutyData)
      }
    );

    const createText =
      await createResponse.text();

    if (!createResponse.ok) {
      return res.status(500).json({
        error: "নতুন Duty তৈরি করা যায়নি",
        details: createText
      });
    }

    let createdDuty;

    try {
      createdDuty = createText
        ? JSON.parse(createText)
        : [];
    } catch {
      createdDuty = [];
    }

    return res.status(200).json({
      ok: true,
      message:
        `${dutyHours} ঘণ্টার Duty successfully published`,
      duty:
        Array.isArray(createdDuty)
          ? createdDuty[0]
          : createdDuty,
      calculation: {
        videos: videosRequired,
        ads_per_video: adsPerVideo,
        total_ads: totalAds,
        reward_per_ad: rewardPerAd,
        total_reward: totalReward
      }
    });

  } catch (error) {
    console.error(
      "Duty settings error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Duty Publish করতে সমস্যা হয়েছে"
    });
  }
}
