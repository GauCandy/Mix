const { renameChannelByCategory } = require("../functions/rename");

const CATEGORY_1 = "1411034825699233943"; // danh mục hoạt động
const CATEGORY_2 = "1427958263281881088"; // danh mục ngủ
const INACTIVITY_TIME = 1000 * 60 * 60 * 24; // 1 ngày

module.exports = (client) => {
  const inactivityTimers = new Map();

  // ===== Khi webhook gửi tin =====
  client.on("messageCreate", async (msg) => {
    try {
      if (!msg.webhookId) return;
      const channel = msg.channel;
      if (!channel || !channel.parentId) return;

      // Auto rename khi có webhook
      await renameChannelByCategory(channel);

      if (inactivityTimers.has(channel.id)) clearTimeout(inactivityTimers.get(channel.id));

      // Nếu webhook trong danh mục 2 → chuyển về danh mục 1
      if (channel.parentId === CATEGORY_2) {
        await channel.setParent(CATEGORY_1, { lockPermissions: false }).catch(() => {});
        setTimeout(async () => {
          await renameChannelByCategory(channel);
        }, 1000);
        console.log(`🔄 Đưa ${channel.name} → danh mục hoạt động (do có webhook mới)`);
      }

      // Reset hẹn giờ 1 ngày
      const timer = setTimeout(async () => {
        try {
          if (channel.parentId === CATEGORY_1) {
            await channel.setParent(CATEGORY_2, { lockPermissions: false }).catch(() => {});
            setTimeout(async () => {
              await renameChannelByCategory(channel);
            }, 1000);
            console.log(`📦 Chuyển ${channel.name} → danh mục ngủ (1 ngày không có webhook)`);
          }
        } catch (err) {
          console.error("❌ Lỗi khi chuyển danh mục:", err);
        }
      }, INACTIVITY_TIME);

      inactivityTimers.set(channel.id, timer);
    } catch (err) {
      console.error("❌ Lỗi messageCreate:", err);
    }
  });

  // ===== Khi channel được tạo =====
  client.on("channelCreate", async (channel) => {
    try {
      await renameChannelByCategory(channel);
    } catch (err) {
      console.error("❌ Lỗi channelCreate:", err);
    }
  });

  // ===== Khi kênh được đổi danh mục (thủ công hoặc bot) =====
  client.on("channelUpdate", async (oldCh, newCh) => {
    try {
      if (!newCh || newCh.type !== 0) return;

      // Khi parentId đổi, đợi Discord cập nhật rồi rename
      if (oldCh.parentId !== newCh.parentId) {
        setTimeout(async () => {
          await renameChannelByCategory(newCh);
        }, 1000); // đợi 1s để đảm bảo parentId sync
      }
    } catch (err) {
      console.error("❌ Lỗi channelUpdate:", err);
    }
  });

  // ===== Khi kênh bị xóa =====
  client.on("channelDelete", (channel) => {
    if (inactivityTimers.has(channel.id)) {
      clearTimeout(inactivityTimers.get(channel.id));
      inactivityTimers.delete(channel.id);
    }
  });
};
