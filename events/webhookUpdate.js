const { Events } = require("discord.js");
const { renameChannelByCategory } = require("../functions/rename");

// ====== CONFIG ======
const CATEGORY_ACTIVE = process.env.CATEGORY_ACTIVE; // ID danh mục hoạt động
const CATEGORY_SLEEP = process.env.CATEGORY_SLEEP;   // ID danh mục ngủ

module.exports = {
  name: Events.WebhooksUpdate,
  async execute(channel) {
    try {
      if (!channel || !channel.guild) return;

      // Fetch lại để tránh cache cũ
      channel = await channel.guild.channels.fetch(channel.id).catch(() => null);
      if (!channel) return;

      const webhooks = await channel.fetchWebhooks().catch(() => null);
      if (!webhooks) return;

      const hasWebhook = webhooks.size > 0;

      // === 1️⃣ Có webhook mới → chuyển sang danh mục hoạt động ===
      if (hasWebhook && channel.parentId === CATEGORY_SLEEP) {
        console.log(`🔄 Đưa ${channel.name} → danh mục hoạt động (do có webhook mới)`);

        await moveChannelSafe(channel, CATEGORY_ACTIVE);
      }

      // === 2️⃣ Không còn webhook → chuyển sang danh mục ngủ ===
      if (!hasWebhook && channel.parentId === CATEGORY_ACTIVE) {
        console.log(`😴 Đưa ${channel.name} → danh mục ngủ (do không còn webhook)`);

        await moveChannelSafe(channel, CATEGORY_SLEEP);
      }
    } catch (err) {
      console.error("❌ Lỗi tại webhookUpdate:", err);
    }
  },
};

// ===== Hàm di chuyển & rename an toàn =====
async function moveChannelSafe(channel, newCategoryId) {
  try {
    // Di chuyển kênh sang danh mục mới
    await channel.setParent(newCategoryId, { lockPermissions: false }).catch(() => {});
    console.log(`📦 Đã di chuyển ${channel.name} sang category ${newCategoryId}`);

    // Kiểm tra Discord đã sync chưa
    const checkInterval = setInterval(async () => {
      try {
        const fresh = await channel.guild.channels.fetch(channel.id);

        if (fresh.parentId === newCategoryId && fresh.permissionsLocked === false) {
          clearInterval(checkInterval);
          await renameChannelByCategory(fresh);
          console.log(`✅ Đã đổi tên sau khi move: ${fresh.name}`);
        }
      } catch (err) {
        console.error("⚠️ Lỗi khi chờ sync:", err);
        clearInterval(checkInterval);
      }
    }, 1500);

    // Dừng kiểm tra sau 10s nếu Discord vẫn chưa sync
    setTimeout(() => clearInterval(checkInterval), 10000);
  } catch (err) {
    console.error(`❌ Lỗi moveChannelSafe (${channel.name}):`, err);
  }
}
