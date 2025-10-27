// events/channelHandler.js
const { renameChannelByCategory } = require("../functions/rename");

const CATEGORY_1 = "1411034825699233943";       // danh mục hoạt động
const CATEGORY_2 = "1427958263281881088";       // danh mục ngủ
const INACTIVITY_TIME = 1000 * 60 * 60 * 24;    // 1 ngày

module.exports = (client) => {
  const timers = new Map();

  // Khi có webhook gửi tin
  client.on("messageCreate", async (msg) => {
    try {
      if (!msg.webhookId) return;
      const ch = msg.channel;
      if (!ch?.parentId) return;

      // Reset timer
      if (timers.has(ch.id)) clearTimeout(timers.get(ch.id));

      // Nếu webhook hoạt động trong danh mục 2 → chuyển lại danh mục 1
      if (ch.parentId === CATEGORY_2) {
        await ch.setParent(CATEGORY_1, { lockPermissions: false }).catch(() => {});
        await renameChannelByCategory(ch);
      }

      // Đặt lại hẹn 1 ngày
      const t = setTimeout(async () => {
        try {
          if (ch.parentId === CATEGORY_1) {
            await ch.setParent(CATEGORY_2, { lockPermissions: false }).catch(() => {});
            await renameChannelByCategory(ch);
            console.log(`📦 Chuyển ${ch.name} → danh mục 2 (1 ngày không có webhook)`);
          }
        } catch (err) {
          console.error("❌ Lỗi chuyển danh mục:", err);
        }
      }, INACTIVITY_TIME);

      timers.set(ch.id, t);
    } catch (err) {
      console.error("❌ Lỗi messageCreate:", err);
    }
  });

  // Khi channel mới được tạo
  client.on("channelCreate", async (ch) => {
    try {
      await renameChannelByCategory(ch);

      if (ch.parentId === CATEGORY_1) {
        const t = setTimeout(async () => {
          try {
            await ch.setParent(CATEGORY_2, { lockPermissions: false }).catch(() => {});
            await renameChannelByCategory(ch);
            console.log(`📦 Chuyển ${ch.name} → danh mục 2 (1 ngày không có webhook)`);
          } catch (err) {
            console.error("❌ Lỗi chuyển danh mục:", err);
          }
        }, INACTIVITY_TIME);

        timers.set(ch.id, t);
      }
    } catch (err) {
      console.error("❌ Lỗi channelCreate:", err);
    }
  });

  // Khi channel được chuyển danh mục thủ công
  client.on("channelUpdate", async (oldCh, newCh) => {
    try {
      if (!newCh || newCh.type !== 0) return;
      if (oldCh.parentId !== newCh.parentId) {
        await renameChannelByCategory(newCh);
      }
    } catch (err) {
      console.error("❌ Lỗi channelUpdate:", err);
    }
  });

  // Khi channel bị xóa
  client.on("channelDelete", (ch) => {
    if (timers.has(ch.id)) {
      clearTimeout(timers.get(ch.id));
      timers.delete(ch.id);
    }
  });
};
