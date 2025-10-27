const { renameChannelByCategory } = require("../functions/rename");

const CATEGORY_ACTIVE = "1411034825699233943"; // danh mục hoạt động
const CATEGORY_SLEEP = "1427958263281881088";  // danh mục ngủ
const INACTIVITY_TIME = 1000 * 60 * 60 * 24;   // 1 ngày (24h)

module.exports = (client) => {
  const timers = new Map();

  // ===============================
  // ⚡ Di chuyển danh mục + rename tức thì
  // ===============================
  async function moveAndRename(channel, newCategoryId) {
    if (!channel || !channel.manageable) return;
    try {
      await channel.setParent(newCategoryId, { lockPermissions: false });
      await renameChannelByCategory(channel);
      console.log(`🔁 Di chuyển + rename xong: ${channel.name}`);
    } catch (err) {
      console.error("❌ moveAndRename lỗi:", err.message);
    }
  }

  // ===============================
  // 📩 Khi webhook gửi tin
  // ===============================
  client.on("messageCreate", async (msg) => {
    try {
      if (!msg.webhookId) return;
      const channel = msg.channel;
      if (!channel || !channel.parentId) return;

      // reset timer
      if (timers.has(channel.id)) clearTimeout(timers.get(channel.id));

      if (channel.parentId === CATEGORY_SLEEP) {
        console.log(`🔄 Webhook mới → ${channel.name} trở lại danh mục hoạt động`);
        await moveAndRename(channel, CATEGORY_ACTIVE);
      } else {
        await renameChannelByCategory(channel);
      }

      // hẹn 24h không có webhook → chuyển sang ngủ
      const timer = setTimeout(async () => {
        try {
          if (channel.parentId === CATEGORY_ACTIVE) {
            console.log(`💤 ${channel.name} không hoạt động 24h → chuyển danh mục ngủ`);
            await moveAndRename(channel, CATEGORY_SLEEP);
          }
        } catch (err) {
          console.error("❌ Timer lỗi:", err.message);
        }
      }, INACTIVITY_TIME);

      timers.set(channel.id, timer);
    } catch (err) {
      console.error("❌ messageCreate lỗi:", err.message);
    }
  });

  // ===============================
  // 🆕 Khi channel được tạo
  // ===============================
  client.on("channelCreate", async (channel) => {
    try {
      await renameChannelByCategory(channel);
    } catch (err) {
      console.error("❌ channelCreate lỗi:", err.message);
    }
  });

  // ===============================
  // ⚙️ Khi đổi danh mục thủ công hoặc do bot
  // ===============================
  client.on("channelUpdate", async (oldCh, newCh) => {
    try {
      if (!newCh || newCh.type !== 0) return;
      if (oldCh.parentId !== newCh.parentId) {
        console.log(`🪄 ChannelUpdate: ${newCh.name} đổi danh mục`);
        await renameChannelByCategory(newCh);
      }
    } catch (err) {
      console.error("❌ channelUpdate lỗi:", err.message);
    }
  });

  // ===============================
  // ❌ Khi channel bị xóa → dọn timer
  // ===============================
  client.on("channelDelete", (channel) => {
    if (timers.has(channel.id)) {
      clearTimeout(timers.get(channel.id));
      timers.delete(channel.id);
    }
  });

  // ===============================
  // 🚀 Khi bot khởi động → quét và rename tất cả
  // ===============================
  client.once("ready", async () => {
    try {
      console.log(`✅ Bot đã online: ${client.user.tag}`);
      const guild = client.guilds.cache.first();
      if (!guild) return;

      const allChannels = await guild.channels.fetch();
      for (const [, ch] of allChannels) {
        if (!ch || ch.type !== 0) continue;
        if ([CATEGORY_ACTIVE, CATEGORY_SLEEP].includes(ch.parentId)) {
          await renameChannelByCategory(ch);
        }
      }

      console.log("🔍 Đã quét & rename toàn bộ channel trong 2 danh mục.");
    } catch (err) {
      console.error("❌ Lỗi khi quét channel khi khởi động:", err.message);
    }
  });
};
