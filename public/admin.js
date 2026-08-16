async function load() {
  try {
    const r = await fetch("/api/admin/users");

    if (!r.ok) {
      location.href = "/";
      return;
    }

    const u = await r.json();

    const usersElement = document.getElementById("users");

    if (!usersElement) return;

    usersElement.innerHTML =
      u.map(x => `
        <div class="user">
          <div>
            <b>${escapeHtml(x.name || "")}</b>
            <p>
              ${escapeHtml(x.phone || "")}
              ·
              ${escapeHtml(x.status || "")}
            </p>
          </div>

          ${
            x.status !== "active"
              ? `<button onclick="approve('${x.id}')">
                   Approve
                 </button>`
              : ""
          }
        </div>
      `).join("") ||
      "<p>No workers yet.</p>";

  } catch (error) {
    console.error("Worker loading error:", error);
  }
}


// =====================================
// Approve Worker
// =====================================

async function approve(id) {

  try {

    const r = await fetch(
      "/api/admin/users/" +
      encodeURIComponent(id) +
      "/approve",
      {
        method: "POST"
      }
    );

    const d = await r.json();

    if (!r.ok) {
      alert(d.error || "Worker approve করা যায়নি");
      return;
    }

    await load();

  } catch (error) {

    console.error(error);

    alert(
      "Worker approve করতে সমস্যা হয়েছে"
    );
  }
}


// =====================================
// Create Normal Task
// =====================================

async function createTask() {

  const titleElement =
    document.getElementById("title");

  const urlElement =
    document.getElementById("url");

  const rewardElement =
    document.getElementById("reward");

  const durationElement =
    document.getElementById("duration");

  const msgElement =
    document.getElementById("msg");

  const title =
    titleElement?.value.trim();

  const videoUrl =
    urlElement?.value.trim();

  const reward =
    Number(rewardElement?.value || 0);

  const duration =
    Number(durationElement?.value || 0);


  if (!title || !videoUrl || reward <= 0 || duration <= 0) {

    if (msgElement) {
      msgElement.textContent =
        "সব তথ্য সঠিকভাবে দিন";
    }

    return;
  }


  if (msgElement) {
    msgElement.textContent =
      "Task তৈরি হচ্ছে...";
  }


  try {

    const r = await fetch(
      "/api/admin/tasks",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          title: title,
          video_url: videoUrl,
          reward: reward,
          duration_seconds: duration
        })
      }
    );

    const d = await r.json();

    if (!r.ok) {

      if (msgElement) {
        msgElement.textContent =
          d.error ||
          "Task তৈরি করা যায়নি";
      }

      return;
    }


    if (msgElement) {
      msgElement.textContent =
        "Task successfully created.";
    }


    if (titleElement)
      titleElement.value = "";

    if (urlElement)
      urlElement.value = "";

    if (rewardElement)
      rewardElement.value = "";

    if (durationElement)
      durationElement.value = "5400";

  } catch (error) {

    console.error(
      "Create task error:",
      error
    );

    if (msgElement) {
      msgElement.textContent =
        "Task তৈরি করতে সমস্যা হয়েছে";
    }
  }
}


// =====================================
// Publish Duty
// =====================================

async function createDuty(
  dutyHours,
  videoCount,
  adsPerVideo,
  rewardPerAd,
  videoDurationSeconds
) {

  const dutyMsg =
    document.getElementById("dutyMsg");


  if (dutyMsg) {
    dutyMsg.textContent =
      `${dutyHours} ঘণ্টার Duty publish হচ্ছে...`;
  }


  // Calculate values
  const totalAds =
    Number(videoCount) *
    Number(adsPerVideo);

  const totalReward =
    totalAds *
    Number(rewardPerAd);


  try {

    /*
      Admin Duty API
    */

    const r = await fetch(
      "/api/admin/duty-settings",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          duty_hours:
            Number(dutyHours),

          video_count:
            Number(videoCount),

          videos_required:
            Number(videoCount),

          ads_per_video:
            Number(adsPerVideo),

          reward_per_ad:
            Number(rewardPerAd),

          video_duration_seconds:
            Number(videoDurationSeconds),

          total_ads:
            totalAds,

          total_reward:
            totalReward
        })
      }
    );


    const text =
      await r.text();


    let d;

    try {
      d = text
        ? JSON.parse(text)
        : {};
    } catch {
      d = {
        error: text
      };
    }


    if (!r.ok) {

      console.error(
        "Duty publish failed:",
        d
      );

      if (d.error) {

        if (d.error.includes("row-level security")) {

          if (dutyMsg) {
            dutyMsg.textContent =
              "Supabase RLS permission error।";
          }

        } else {

          if (dutyMsg) {
            dutyMsg.textContent =
              d.error;
          }
        }

      } else {

        if (dutyMsg) {
          dutyMsg.textContent =
            "Duty Publish করা যায়নি।";
        }
      }

      return;
    }


    /*
      Success
    */

    if (dutyMsg) {

      dutyMsg.textContent =
        `${dutyHours} ঘণ্টার Duty successfully published.`;
    }


    console.log(
      "Duty published:",
      d
    );


  } catch (error) {

    console.error(
      "Duty publish error:",
      error
    );

    if (dutyMsg) {

      dutyMsg.textContent =
        "Duty Publish করতে সংযোগ সমস্যা হয়েছে।";
    }
  }
}


// =====================================
// Escape HTML
// =====================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// =====================================
// Start
// =====================================

load();
