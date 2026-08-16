async function load() {
  try {
    const r = await fetch("/api/admin/users");

    if (!r.ok) {
      location.href = "/";
      return;
    }

    const u = await r.json();

    document.getElementById("users").innerHTML =
      u.length
        ? u.map(x => `
            <div class="user">
              <div>
                <b>${x.name}</b>
                <p>${x.phone} · ${x.status}</p>
              </div>

              ${
                x.status !== "active"
                  ? `<button onclick="approve(${x.id})">
                       Approve
                     </button>`
                  : ""
              }
            </div>
          `).join("")
        : "<p>No workers yet.</p>";

  } catch (error) {
    console.error(error);
  }
}

async function approve(id) {
  await fetch(
    "/api/admin/users/" + id + "/approve",
    {
      method: "POST"
    }
  );

  load();
}

async function createTask() {
  const msg = document.getElementById("msg");

  msg.textContent = "Task তৈরি হচ্ছে...";

  try {
    const r = await fetch(
      "/api/admin/tasks",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: document.getElementById("title").value,
          video_url: document.getElementById("url").value,
          reward: Number(
            document.getElementById("reward").value
          ),
          duration_seconds: Number(
            document.getElementById("duration").value
          )
        })
      }
    );

    const d = await r.json();

    msg.textContent =
      d.ok
        ? "Task সফলভাবে তৈরি হয়েছে।"
        : d.error || "Task তৈরি করা যায়নি।";

  } catch (error) {
    console.error(error);

    msg.textContent =
      "Server error হয়েছে।";
  }
}

async function createDuty(
  dutyHours,
  videoCount,
  adsPerVideo,
  rewardPerAd,
  videoDurationSeconds
) {
  const dutyMsg =
    document.getElementById("dutyMsg");

  if (!dutyMsg) return;

  dutyMsg.textContent =
    "Duty publish হচ্ছে...";

  try {
    const r = await fetch(
      "/api/admin/duty-settings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          duty_hours: Number(dutyHours),
          video_count: Number(videoCount),
          ads_per_video: Number(adsPerVideo),
          reward_per_ad: Number(rewardPerAd),
          video_duration_seconds:
            Number(videoDurationSeconds)
        })
      }
    );

    const d = await r.json();

    if (!r.ok) {
      dutyMsg.textContent =
        d.error || "Duty publish করা যায়নি।";
      return;
    }

    dutyMsg.textContent =
      `${dutyHours} ঘণ্টার Duty সফলভাবে প্রকাশ হয়েছে।`;

  } catch (error) {
    console.error("Duty publish error:", error);

    dutyMsg.textContent =
      "Duty publish করতে Server error হয়েছে।";
  }
}

async function logout() {
  await fetch("/api/logout", {
    method: "POST"
  });

  location.href = "/";
}

load();
