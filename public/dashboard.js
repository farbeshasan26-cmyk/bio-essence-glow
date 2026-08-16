async function load() {
  try {
    const meResponse = await fetch("/api/me");

    if (!meResponse.ok) {
      location.href = "/";
      return;
    }

    const u = await meResponse.json();

    document.getElementById("name").textContent =
      "স্বাগতম, " + (u.name || "Worker");

    document.getElementById("balance").textContent =
      "৳" + Number(u.balance || 0);

    document.getElementById("pending").textContent =
      "৳" + Number(u.pending_balance || 0);

    await loadDuty();
    await loadTasks();

  } catch (error) {
    console.error(error);

    document.getElementById("tasks").innerHTML =
      "<p>ডেটা লোড করতে সমস্যা হয়েছে। পেজটি Refresh করুন।</p>";
  }
}

async function loadDuty() {
  const container = document.getElementById("tasks");

  try {
    const response = await fetch("/api/duty-settings");

    const data = await response.json();

    if (!response.ok) {
      container.innerHTML =
        "<p>Duty লোড করা যায়নি।</p>";
      return;
    }

    const duties = Array.isArray(data.duties)
      ? data.duties
      : [];

    if (!duties.length) {
      container.innerHTML =
        "<p>Admin এখনো কোনো Duty প্রকাশ করেননি।</p>";
      return;
    }

    const dutyHtml = duties.map(duty => {
      const hours = Number(duty.duty_hours || 0);
      const videos = Number(duty.video_count || 0);
      const ads = Number(duty.ads_per_video || 0);
      const reward = Number(duty.reward_per_ad || 0);
      const totalAds = Number(
        duty.total_ads || videos * ads
      );
      const totalReward = Number(
        duty.total_reward || totalAds * reward
      );

      const durationSeconds = Number(
        duty.video_duration_seconds || 5400
      );

      const durationMinutes =
        Math.round(durationSeconds / 60);

      return `
        <div class="task panel">
          <h3>${hours} ঘণ্টার Duty</h3>

          <p>ভিডিও: <strong>${videos}টি</strong></p>

          <p>
            প্রতি ভিডিওতে Ads:
            <strong>${ads}টি</strong>
          </p>

          <p>
            প্রতি Ad:
            <strong>৳${reward}</strong>
          </p>

          <p>
            মোট Ads:
            <strong>${totalAds}টি</strong>
          </p>

          <p>
            মোট Reward:
            <strong>৳${totalReward}</strong>
          </p>

          <p>
            প্রতি ভিডিও:
            <strong>${durationMinutes} মিনিট</strong>
          </p>

          <button
            onclick="startDuty(${hours})"
          >
            ${hours} ঘণ্টার Duty শুরু করুন
          </button>
        </div>
      `;
    }).join("");

    container.innerHTML = dutyHtml;

  } catch (error) {
    console.error("Duty load error:", error);

    container.innerHTML =
      "<p>Duty লোড করতে সমস্যা হয়েছে।</p>";
  }
}

async function loadTasks() {
  const taskContainer = document.getElementById("tasks");

  try {
    const response = await fetch("/api/tasks");

    if (!response.ok) {
      return;
    }

    const tasks = await response.json();

    if (!Array.isArray(tasks) || !tasks.length) {
      return;
    }

    const taskHtml = tasks.map(x => `
      <div class="task">
        <div>
          <b>${x.title || "Task"}</b>
          <p>
            Reward: ৳${Number(x.reward || 0)}
            · ${Number(x.duration_seconds || 0)}s
          </p>
        </div>

        <button onclick="completeTask(${x.id})">
          Start
        </button>
      </div>
    `).join("");

    taskContainer.insertAdjacentHTML(
      "beforeend",
      `
        <div class="panel">
          <h2>Available Tasks</h2>
          ${taskHtml}
        </div>
      `
    );

  } catch (error) {
    console.error("Task load error:", error);
  }
}

function startDuty(hours) {
  alert(
    `${hours} ঘণ্টার Duty নির্বাচন করা হয়েছে।`
  );
}

async function completeTask(id) {
  try {
    const response = await fetch(
      "/api/tasks/" + id + "/complete",
      {
        method: "POST"
      }
    );

    const data = await response.json();

    alert(data.message || data.error || "Task completed");

    load();

  } catch (error) {
    alert("Task complete করতে সমস্যা হয়েছে।");
  }
}

async function logout() {
  await fetch("/api/logout", {
    method: "POST"
  });

  location.href = "/";
}

load();
