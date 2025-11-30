// events/channelHandler.js
const { updateWebhookActivity, checkWebhookWarnings, resetStreak, getRecord } = require("../functions/webhookTracker");
const { renameChannelByCategory } = require("../functions/rename");

// ====== CẤU HÌNH ======
const ACTIVE_CATEGORY_ID = "1411034825699233943"; // danh mục hoạt động
const SLEEP_CATEGORY_ID = "1427958263281881088";  // danh mục ngủ
const WARN_LOG_CHANNEL = "ID_KENH_LOG_CANH_CAO";  // nếu bạn có kênh log cảnh cáo
const AUTO_ROLE = "1411991634194989096";         // role auto
const CHECK_WARN_INTERVAL_MS = 60 * 60 * 1000;   // 1 giờ

module.exports = (client) => {
  console.log("[ChannelHandler] loaded (webhook-first, streak-enabled)");

  // ----- Helpers -----
  async function findMemberByChannel(channel, usernameGuess) {
    if (!channel || !channel.guild) return null;
    // ưu tiên: tìm theo topic userId (nếu bạn lưu userId trong topic)
    const topic = channel.topic || "";
    const topicUserId = topic.match(/\d{17,20}/)?.[0];
    if (topicUserId) {
      const m = await channel.guild.members.fetch(topicUserId).catch(() => null);
      if (m) return m;
    }
    // fallback: tìm theo username (usernameGuess từ tên kênh)
    if (usernameGuess) {
      const found = channel.guild.members.cache.find(m => {
        // so khớp với username, nickname hoặc tag (ưu tiên username)
        return (m.user.username && m.user.username.toLowerCase() === usernameGuess.toLowerCase())
          || (m.nickname && m.nickname.toLowerCase() === usernameGuess.toLowerCase());
      });
      if (found) return found;
    }
    return null;
  }

  async function updateRoleByCategory(channel, addRole) {
    try {
      const username = channel.name.replace(/.*】/g, "").replace("-macro", "");
      const member = await findMemberByChannel(channel, username);
      if (!member) return;

      if (addRole) {
        if (!member.roles.cache.has(AUTO_ROLE)) {
          await member.roles.add(AUTO_ROLE).catch(err => console.error("❌ addRole err:", err));
          console.log(`✅ Added AUTO role to ${member.user.tag}`);
        }
      } else {
        if (member.roles.cache.has(AUTO_ROLE)) {
          await member.roles.remove(AUTO_ROLE).catch(err => console.error("❌ removeRole err:", err));
          console.log(`🧹 Removed AUTO role from ${member.user.tag}`);
        }
      }
    } catch (err) {
      console.error("❌ Role update error:", err);
    }
  }

  async function sendNotify(channel, type) {
    try {
      const username = channel.name.replace(/.*】/g, "").replace("-macro", "");
      const member = await findMemberByChannel(channel, username);
      if (!member) return;
      if (type === "sleep") {
        await channel.send(`<@${member.id}>\nKênh macro của bạn đã được chuyển về **NGỦ** (do inactivity).`).catch(() => {});
      } else if (type === "active") {
        await channel.send(`<@${member.id}>\nKênh macro của bạn đã được **mở lại** do webhook hoạt động.`).catch(() => {});
      } else if (type === "reset") {
        await channel.send(`<@${member.id}>\nChuỗi hoạt động của bạn đã bị **reset** do lâu không hoạt động.`).catch(() => {});
      }
    } catch (e) {
      console.error("❌ sendNotify err:", e);
    }
  }

  // ----- READY: bật hệ thống check cảnh báo hàng giờ -----
  client.on("ready", () => {
    console.log("Webhook warning system active (hourly).");
    // chạy ngay:
    checkWebhookWarnings(client, WARN_LOG_CHANNEL, SLEEP_CATEGORY_ID).catch(() => {});
    setInterval(() => {
      checkWebhookWarnings(client, WARN_LOG_CHANNEL, SLEEP_CATEGORY_ID).catch(err => console.error("❌ checkWebhookWarnings err:", err));
    }, CHECK_WARN_INTERVAL_MS);
  });

  // ----- MESSAGE CREATE: chỉ xử lý webhook messages (embed only) -----
  client.on("messageCreate", async (message) => {
    try {
      if (!message.webhookId) return;           // chỉ quan tâm webhook
      if (!message.channel || message.channel.type !== 0) return; // text only
      if (!message.embeds || message.embeds.length === 0) return; // chỉ embed tính activity

      const channel = message.channel;
      const webhookId = message.webhookId;

      // --- Lọc: chỉ xử lý các kênh macro (tên có "-macro") và thuộc 2 category macro (active/sleep)
      const name = channel.name || "";
      if (!name.includes("-macro")) {
        // không phải kênh macro -> bỏ qua
        return;
      }
      if (![ACTIVE_CATEGORY_ID, SLEEP_CATEGORY_ID].includes(channel.parentId)) {
        // kênh không nằm trong 2 category macro -> bỏ qua (vd bot-logs)
        return;
      }

      // Gọi updateWebhookActivity và lưu mapping channelId
      const { added, streak, wasReset } = updateWebhookActivity(webhookId, channel.id);

      // Gán tạm trường runtime để backup (không persist bên discord)
      try { channel.lastWebhookId = webhookId; } catch (e) {}

      // Nếu có reset do 12h inactivity: remove role, reset tên base, notify
      if (wasReset) {
        // reset tên về base (no streak display)
        const username = name.replace(/.*】/g, "").replace(/‹\d+🔥›/g, "").replace("-macro", "").trim();
        const baseName = `🛠★】${username}-macro`;
        if (channel.name !== baseName) {
          await channel.setName(baseName).catch(err => console.error("❌ setName reset err:", err));
        }
        // remove role
        await updateRoleByCategory(channel, false);
        // notify in channel
        await sendNotify(channel, "reset");
        console.log(`🔁 Reset streak for webhook ${webhookId} (channel ${channel.name})`);
      }

      // Nếu +1 streak xảy ra -> đổi tên hiển thị streak
      if (added) {
        const username = name.replace(/.*】/g, "").replace(/‹\d+🔥›/g, "").replace("-macro", "").trim();
        const newName = `🛠★】〔${streak}🔥〕${username}-macro`;
        if (channel.name !== newName) {
          await channel.setName(newName).catch(err => console.error("❌ setName streak err:", err));
        }
        console.log(`+1 streak -> ${newName}`);
      } else {
        // nếu không tăng streak thì đảm bảo tên giữ nguyên prefix phù hợp với parent
        try {
          if (channel.parentId === ACTIVE_CATEGORY_ID && !channel.name.startsWith("🛠★】")) {
            await channel.setName("🛠★】" + name.replace(/^.*?】/, "")).catch(() => {});
          } else if (channel.parentId === SLEEP_CATEGORY_ID && !channel.name.startsWith("⏰★】")) {
            await channel.setName("⏰★】" + name.replace(/^.*?】/, "")).catch(() => {});
          }
        } catch (e) { /* ignore */ }
      }

      // Luôn chuyển về ACTIVE nếu webhook gửi ở SLEEP
      if (channel.parentId === SLEEP_CATEGORY_ID) {
        await channel.setParent(ACTIVE_CATEGORY_ID, { lockPermissions: false }).catch(err => console.error("❌ setParent to ACTIVE err:", err));
        // chờ Discord apply
        await new Promise(r => setTimeout(r, 400));
        // rename theo category
        await renameChannelByCategory(channel).catch(() => {});
        // add role
        await updateRoleByCategory(channel, true);
        await sendNotify(channel, "active").catch(() => {});
        console.log(`🔄 Reactivated (webhook): ${channel.name}`);
      } else {
        // nếu ở ACTIVE thì đảm bảo role được thêm
        await updateRoleByCategory(channel, true);
      }
    } catch (err) {
      console.error("❌ messageCreate handler err:", err);
    }
  });

  // ----- CHANNEL CREATE: rename + role init + if no webhook mapping start neutral -----
  client.on("channelCreate", async (channel) => {
    try {
      await renameChannelByCategory(channel).catch(() => {});
      if (![ACTIVE_CATEGORY_ID, SLEEP_CATEGORY_ID].includes(channel.parentId)) return;

      // nếu thuộc ACTIVE thì add role, nếu thuộc SLEEP thì remove role
      if (channel.parentId === ACTIVE_CATEGORY_ID) {
        await updateRoleByCategory(channel, true);
      } else if (channel.parentId === SLEEP_CATEGORY_ID) {
        await updateRoleByCategory(channel, false);
      }
    } catch (err) {
      console.error("❌ channelCreate err:", err);
    }
  });

  // ----- CHANNEL UPDATE: chỉ thực hiện khi parentId thay đổi (tránh loop) -----
  client.on("channelUpdate", async (oldCh, newCh) => {
    try {
      if (!oldCh || !newCh) return;
      if (oldCh.parentId === newCh.parentId && oldCh.name === newCh.name) return; // không thay đổi gì quan trọng

      // nếu chuyển vào danh mục NGỦ -> reset streak + remove role + reset tên
      if (newCh.parentId === SLEEP_CATEGORY_ID) {
        // cố gắng lấy webhookId từ persist mapping
        const record = getRecord(newCh.lastWebhookId) || (newCh.id ? Object.values(require("../data/webhookActivity.json") || {}).find(r => r.channelId === newCh.id) : null);
        if (record && record.channelId) {
          // nếu có webhookId field tồn tại thì reset bằng hàm resetStreak
          // tìm webhookId key: (we'll search data file)
          const data = (function load(){ try { return require("../data/webhookActivity.json"); } catch(e){ return {}; } })();
          const webhookEntry = Object.entries(data).find(([k, v]) => v.channelId === newCh.id);
          if (webhookEntry) {
            const webhookId = webhookEntry[0];
            resetStreak(webhookId);
          }
        }

        // reset tên về base
        const username = newCh.name.replace(/.*】/g, "").replace(/‹\d+🔥›/g, "").replace("-macro", "").trim();
        const baseName = `⏰★】${username}-macro`;
        if (newCh.name !== baseName) {
          await newCh.setName(baseName).catch(() => {});
        }

        await updateRoleByCategory(newCh, false);
        await sendNotify(newCh, "sleep");
        console.log(`📦 Moved ${newCh.name} → DORMANT (manual move)`);
      } else if (newCh.parentId === ACTIVE_CATEGORY_ID) {
        // moved to active: ensure role and name prefix
        if (!newCh.name.startsWith("🛠★】")) {
          await newCh.setName("🛠★】" + newCh.name.replace(/^.*?】/, "")).catch(() => {});
        }
        await updateRoleByCategory(newCh, true);
        await sendNotify(newCh, "active");
        console.log(`🔛 Moved ${newCh.name} → ACTIVE (manual move)`);
      }
    } catch (err) {
      console.error("❌ channelUpdate err:", err);
    }
  });

  // ----- MESSAGE DELETE: nếu kênh sau delete không còn embed thì không làm gì ở webhook-first design -----
  client.on("messageDelete", async (message) => {
    // không cần làm gì đặc biệt ở thiết kế webhook-first (chỉ dựa trên event webhook để +1/refresh)
  });

  // ----- MESSAGE UPDATE: nếu embed xuất hiện trên message update, xử lý tương tự messageCreate -----
  client.on("messageUpdate", async (oldMsg, newMsg) => {
    try {
      if (!newMsg) return;
      if (!newMsg.webhookId) return;
      // nếu newMsg chứa embed -> trigger same as messageCreate minimal flow
      if (newMsg.embeds && newMsg.embeds.length > 0) {
        // reuse same event: call updateWebhookActivity and handle minimal reactivation/role
        const channel = newMsg.channel;
        const webhookId = newMsg.webhookId;
        if (!channel || !channel.name || !channel.name.includes("-macro")) return;
        const { added, streak, wasReset } = updateWebhookActivity(webhookId, channel.id);
        if (wasReset) {
          const username = channel.name.replace(/.*】/g, "").replace(/‹\d+🔥›/g, "").replace("-macro", "").trim();
          await channel.setName(`🛠★】${username}-macro`).catch(() => {});
          await updateRoleByCategory(channel, false);
          await sendNotify(channel, "reset");
        }
        if (added) {
          const username = channel.name.replace(/.*】/g, "").replace(/‹\d+🔥›/g, "").replace("-macro", "").trim();
          await channel.setName(`🛠★】‹${streak}🔥›${username}-macro`).catch(() => {});
        }
        // ensure active parent & role
        if (channel.parentId === SLEEP_CATEGORY_ID) {
          await channel.setParent(ACTIVE_CATEGORY_ID, { lockPermissions: false }).catch(() => {});
          await renameChannelByCategory(channel).catch(()=>{});
          await updateRoleByCategory(channel, true);
          await sendNotify(channel, "active");
        } else {
          await updateRoleByCategory(channel, true);
        }
      }
    } catch (e) {
      console.error("❌ messageUpdate handler err:", e);
    }
  });

  // ----- CHANNEL DELETE: cleanup runtime only -----
  client.on("channelDelete", (channel) => {
    try {
      // nothing persistent to clean beyond webhookActivity.json which we leave as history
      console.log(`🗑️ Channel deleted: ${channel?.name || channel?.id}`);
    } catch (e) {}
  });
};
