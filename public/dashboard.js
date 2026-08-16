```javascript
async function load() {
  try {
    // =========================
    // Worker account information
    // =========================

    const meResponse = await fetch("/api/me");

    if (!meResponse.ok) {
      const errorText = await meResponse.text();

      document.body.innerHTML =
        "<h2>Login session error</h2>" +
        "<pre>" +
        errorText +
        "</pre>" +
        "<p>Status: " +
        meResponse.status +
        "</p>";

      return;
    }

    const u = await meResponse.json();

    document.getElementById("name").textContent =
      "স্বাগতম, " +
      (u.name || "Worker");

    document.getElementById("phone").textContent =
      u.phone || "Worker Account";

    document.getElementById("balance").textContent =
      "৳" +
      Number(u.balance || 0).toLocaleString("bn-BD");

    document.getElementById("pending").textContent =
      "৳" +
      Number(
        u.pending_balance ||
        u.pending ||
        0
      ).toLocaleString("bn-BD");

    document.getElementById("completedAds").textContent =
      Number(
        u.completed_ads ||
        u.total_ads ||
        0
      ).toLocaleString("bn-BD");


    // =========================
    // Load published duties
    // =========================

    await loadDuties();


    // =========================
    // Load normal tasks
    // =========================

    const taskResponse =
      await fetch("/api/tasks");

    if (!taskResponse.ok) {
      throw new Error(
        "Task load failed"
      );
    }

    const t =
      await taskResponse.json();

    const tasksElement =
      document.getElementById("tasks");

    if (!Array.isArray(t) || !t.length) {

      tasksElement.innerHTML =
        "<p>এই মুহূর্তে কোনো task নেই।</p>";

    } else {

      tasksElement.innerHTML =
        t.map(x => `
          <div class="task">

            <div>
              <b>${escapeHtml(x.title)}</b>

              <p>
                Reward: ৳${Number(
                  x.reward || 0
                )}

                ·

                ${Number(
                  x.duration_seconds || 0
                )}s
              </p>
            </div>

            <button
              onclick="completeTask(${Number(x.id)})"
            >
              Start
            </button>

          </div>
        `).join("");
    }

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    const tasksElement =
      document.getElementById("tasks");

    if (tasksElement) {
      tasksElement.innerHTML =
        "<p>Dashboard load করতে সমস্যা হয়েছে।</p>";
    }
  }
}


// ======================================
// Load Admin-published Duty
// ======================================

async function loadDuties() {

  const dutiesElement =
    document.getElementById("duties");

  if (!dutiesElement) return;

  dutiesElement.innerHTML =
    "<p>Duty লোড হচ্ছে...</p>";

  try {

    const response =
      await fetch("/api/duty-settings");

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Duty load failed"
      );
    }

    const duties =
      Array.isArray(data.duties)
        ? data.duties
        : [];

    if (!duties.length) {

      dutiesElement.innerHTML =
        "<p>এখনো কোনো Duty Publish করা হয়নি।</p>";

      return;
    }


    dutiesElement.innerHTML =
      duties.map(duty => {

        const hours =
          Number(duty.duty_hours || 0);

        const videos =
          Number(
            duty.videos_required ||
            duty.video_count ||
            0
          );

        const adsPerVideo =
          Number(
            duty.ads_per_video || 0
          );

        const rewardPerAd =
          Number(
            duty.reward_per_ad || 0
          );

        const totalAds =
          Number(
            duty.total_ads ||
            videos * adsPerVideo
          );

        const totalReward =
          Number(
            duty.total_reward ||
            totalAds * rewardPerAd
          );

        const durationSeconds =
          Number(
            duty.video_duration_seconds ||
            0
          );

        const durationMinutes =
          Math.round(
            durationSeconds / 60
          );


        return `
          <div class="duty-card">

            <h3>
              ${hours} ঘণ্টার Duty
            </h3>

            <p>
              <strong>
                ${videos}টি ভিডিও
              </strong>
            </p>

            <p>
              প্রতি ভিডিও:
              ${adsPerVideo}টি Ads
            </p>

            <p>
              প্রতি Ad:
              ৳${rewardPerAd}
            </p>

            <p>
              প্রতি ভিডিও:
              ${durationMinutes} মিনিট
            </p>

            <p>
              মোট Ads:
              <strong>
                ${totalAds}টি
              </strong>
            </p>

            <p class="duty-reward">
              মোট Reward:
              <strong>
                ৳${totalReward.toLocaleString("bn-BD")}
              </strong>
            </p>

            <button
              onclick="startDuty(${hours})"
            >
              Duty শুরু করুন
            </button>

          </div>
        `;

      }).join("");

  } catch (error) {

    console.error(
      "Duty load error:",
      error
    );

    dutiesElement.innerHTML =
      `<p>${escapeHtml(
        error.message ||
        "Duty লোড করা যাচ্ছে না।"
      )}</p>`;
  }
}


// ======================================
// Start Duty
// ======================================

function startDuty(hours) {

  alert(
    `${hours} ঘণ্টার Duty নির্বাচিত হয়েছে।`
  );

  /*
    আসল ভিডিও/Ad workflow
    পরের ধাপে এখানে যুক্ত করা হবে।
  */
}


// ======================================
// Complete normal task
// ======================================

async function completeTask(id) {

  try {

    const response =
      await fetch(
        "/api/tasks/" +
        id +
        "/complete",
        {
          method: "POST"
        }
      );

    const data =
      await response.json();

    alert(
      data.message ||
      data.error ||
      "Task complete হয়েছে"
    );

    await load();

  } catch (error) {

    alert(
      "Task complete করতে সমস্যা হয়েছে।"
    );

    console.error(error);
  }
}


// ======================================
// Logout
// ======================================

async function logout() {

  try {

    await fetch(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch (error) {

    console.error(error);

  } finally {

    window.location.href = "/";
  }
}


// ======================================
// Basic HTML escaping
// ======================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// Start dashboard
load();
```
