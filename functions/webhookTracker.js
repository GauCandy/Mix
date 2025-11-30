// functions/webhookTracker.js
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "webhookActivity.json");

// THAM SỐ
const SIX_HOURS = 6 * 60 * 60 * 1000;       // 6 giờ (ms)
const RESET_INACTIVE = 24 * 60 * 60 * 1000; // reset nếu 24 giờ không activity
const SHORT_DIFF_MS = 5 * 60 * 1000;        // 5 phút, dùng cho tính totalActiveMsToday

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) || {};
  } catch (e) {
    console.error("❌ webhookActivity.json parse error, recreating file:", e);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("❌ failed to save webhookActivity.json", e);
  }
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNeeded(record) {
  const today = todayString();
  if (record.lastReset !== today) {
    record.totalActiveMsToday = 0;
    record.warnCount = 0;
    record.lastReset = today;
  }
}

// ----- updateWebhookActivity(webhookId, channelId)
// - mở rộng record nếu cần
// - cập nhật totalActiveMsToday giống logic cũ
// - xử lý streak: reset nếu > RESET_INACTIVE, +1 nếu >= SIX_HOURS
// - ghi persist mapping channelId để checkWarnings có thể tìm kênh nhanh
// Trả về: { added: bool, streak: number, wasReset: bool }
module.exports.updateWebhookActivity = function (webhookId, channelId = null) {
  const data = loadData();

  if (!data[webhookId]) {
    data[webhookId] = {
      totalActiveMsToday: 0,
      lastMessageAt: 0,
      warnCount: 0,
      lastReset: todayString(),
      // thêm cho streak
      streak: 0,
      lastActiveForStreak: 0,
      // lưu mapping webhook -> channelId (persist)
      channelId: null
    };
  }

  const record = data[webhookId];
  resetIfNeeded(record);

  const now = Date.now();
  let added = false;
  let wasReset = false;

  // nếu có mapping channelId truyền vào, ghi vào record
  if (channelId) record.channelId = channelId;

  // nếu đã lâu không active theo streak rule -> reset streak
  if (record.lastActiveForStreak > 0 && (now - record.lastActiveForStreak) >= RESET_INACTIVE) {
    record.streak = 0;
    wasReset = true;
  }

  // tăng streak nếu đủ 6 giờ kể từ lastActiveForStreak (và không vừa reset)
  if (record.lastActiveForStreak > 0 && (now - record.lastActiveForStreak) >= SIX_HOURS) {
    record.streak = (record.streak || 0) + 1;
    added = true;
  }

  // cập nhật lastActiveForStreak luôn lên now
  record.lastActiveForStreak = now;

  // giữ logic cũ: tích tổng active ms trong ngày (nếu thời gian giữa 2 message < 5 phút)
  if (record.lastMessageAt > 0) {
    const diff = now - record.lastMessageAt;
    if (diff < SHORT_DIFF_MS) {
      record.totalActiveMsToday += diff;
    }
  }
  record.lastMessageAt = now;

  saveData(data);
  return { added, streak: record.streak || 0, wasReset };
};

// ----- checkWebhookWarnings(client, warnChannelId, sleepCategoryId)
// Giữ nguyên ý tưởng cũ nhưng tìm kênh bằng mapping persist record.channelId
module.exports.checkWebhookWarnings = async function (
  client,
  warnChannelId,
  sleepCategoryId
) {
  const data = loadData();
  const warnChannel = client.channels.cache.get(warnChannelId);

  for (const [webhookId, record] of Object.entries(data)) {
    resetIfNeeded(record);
    const hours = (record.totalActiveMsToday || 0) / 1000 / 60 / 60;

    // nếu đủ 6h thì bỏ qua
    if (hours >= 6) continue;

    record.warnCount = (record.warnCount || 0) + 1;

    await warnChannel?.send(
      `⚠️ Webhook **${webhookId}** chỉ chạy **${hours.toFixed(2)}h/6h** hôm nay \n→ Cảnh cáo **${record.warnCount}/2**`
    ).catch(() => {});

    // nếu vượt limit 2 lần -> tìm channel bằng channelId mapping rồi chuyển sang sleep
    if (record.warnCount >= 2) {
      record.warnCount = 0; // reset warnCount

      const channelId = record.channelId;
      let channel = null;
      if (channelId) channel = client.channels.cache.get(channelId);

      // fallback: tìm kênh theo lastWebhookId (nếu có field set trên channel runtime)
      if (!channel) {
        channel = client.channels.cache.find(
          (c) => c.isTextBased && c.lastWebhookId === webhookId
        );
      }

      if (channel) {
        await channel.setParent(sleepCategoryId).catch(() => {});
        await warnChannel?.send(
          `😴 Kênh **${channel.name}** bị chuyển về danh mục NGỦ do webhook không đủ giờ hoạt động!`
        ).catch(() => {});
      } else {
        await warnChannel?.send(
          `⚠️ Không tìm thấy kênh tương ứng với webhook ${webhookId} để chuyển danh mục.`
        ).catch(() => {});
      }
    }
  }

  saveData(data);
};

// ----- resetStreak(webhookId)
// reset streak của webhook (persist)
module.exports.resetStreak = function (webhookId) {
  const data = loadData();
  if (!data[webhookId]) return false;
  data[webhookId].streak = 0;
  data[webhookId].lastActiveForStreak = 0;
  saveData(data);
  return true;
};

// ----- getRecord(webhookId)
// helper read-only
module.exports.getRecord = function (webhookId) {
  const data = loadData();
  return data[webhookId] || null;
};
