const { renameChannelByCategory } = require("../functions/rename");

const CATEGORY_1 = "1411034825699233943"; // danh mục hoạt động
const CATEGORY_2 = "1427958263281881088"; // danh mục ngủ
const INACTIVITY_TIME = 1000 * 60 * 60 * 24; // 1 ngày
const AUTO_ROLE_ID = "1411991634194989096"; // role auto add

module.exports = (client) => {
  const inactivityTimers = new Map(); // Lưu timer từng kênh

  // ===== Khi webhook gửi tin nhắn =====
  client.on("messageCreate", async (msg) => {
    try {
      if (!msg.webhookId) return;
      const channel = msg.channel;
      if (!channel || !channel.parentId) return;

      // Reset timer
      if (inactivityTimers.has(channel.id)) {
        clearTimeout(inactivityTimers.get(channel.id));
      }

      // Nếu webhook hoạt động trong danh mục ngủ → chuyển về danh mục hoạt động
      if (channel.parentId === CATEGORY_2) {
        await channel.setParent(CATEGORY_1, { lockPermissions: false }).catch(() => {});
        await renameChannelByCategory(channel);
        console.log(`🔄 Đưa ${channel.name} về danh mục hoạt động (do có webhook mới)`);
      }

      // Đặt lại timer 1 ngày
      const timer = setTimeout(async () => {
        try {
          if (channel.parentId === CATEGORY_1) {
            await channel.setParent(CATEGORY_2, { lockPermissions: false }).catch(() => {});
            await renameChannelByCategory(channel);
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

  // ===== Khi kênh được tạo =====
  client.on("channelCreate", async (channel) => {
    try {
      await renameChannelByCategory(channel);

      // Nếu nằm trong danh mục hoạt động → thêm role
      if (channel.parentId === CATEGORY_1 && channel.topic) {
        const [userId] = channel.topic.split(" ");
        const guild = channel.guild;

        try {
          const member = await guild.members.fetch(userId);
          const role = guild.roles.cache.get(AUTO_ROLE_ID);
          if (member && role && !member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            console.log(`✅ Thêm role cho ${member.user.tag} (${userId}) khi tạo kênh mới`);
          }
        } catch (err) {
          console.warn(`⚠️ Không thể add role cho ID ${userId} (có thể user rời server hoặc topic lỗi)`);
        }
      }

      // Nếu kênh ở danh mục hoạt động → đặt hẹn chuyển sang danh mục ngủ sau 1 ngày
      if (channel.parentId === CATEGORY_1) {
        const timer = setTimeout(async () => {
          try {
            await channel.setParent(CATEGORY_2, { lockPermissions: false }).catch(() => {});
            await renameChannelByCategory(channel);
            console.log(`📦 Chuyển ${channel.name} → danh mục ngủ (1 ngày không có webhook)`);
          } catch (err) {
            console.error("❌ Lỗi khi chuyển danh mục:", err);
          }
        }, INACTIVITY_TIME);

        inactivityTimers.set(channel.id, timer);
      }
    } catch (err) {
      console.error("❌ Lỗi channelCreate:", err);
    }
  });

  // ===== Khi kênh được chuyển danh mục =====
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

  // ===== Khi kênh bị xóa =====
  client.on("channelDelete", (channel) => {
    if (inactivityTimers.has(channel.id)) {
      clearTimeout(inactivityTimers.get(channel.id));
      inactivityTimers.delete(channel.id);
    }
  });
};
