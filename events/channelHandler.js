const { renameChannelByCategory } = require("../functions/rename");

const CATEGORY_1 = "1411034825699233943"; // danh mục hoạt động
const CATEGORY_2 = "1427958263281881088"; // danh mục ngủ
const INACTIVITY_TIME = 1000 * 60 * 60 * 24; // 1 ngày
const AUTO_ROLE_ID = "1411991634194989096"; // role auto add

module.exports = (client) => {
  const inactivityTimers = new Map(); // Timer từng kênh
  const renameQueue = new Map();      // Queue mỗi kênh để tránh bỏ rename/setParent

  // ===============================
  // ⚡ Queue để xử lý rename/setParent an toàn
  // ===============================
  async function safeRename(channel, fn) {
    const last = renameQueue.get(channel.id) || Promise.resolve();
    const next = last.then(async () => {
      await fn().catch(() => {});
    });
    renameQueue.set(channel.id, next);
    await next;
  }

  // ===============================
  // 🧹 Dọn sạch listener + timer khi bot restart
  // ===============================
  client.once("ready", async () => {
    inactivityTimers.clear();
    console.log("🧹 Dọn sạch timer khi bot khởi động!");
  });

  // ===============================
  // 📩 Khi webhook gửi tin
  // ===============================
  client.removeAllListeners("messageCreate");
  client.on("messageCreate", async (msg) => {
    try {
      if (!msg.webhookId) return;
      const channel = msg.channel;
      if (!channel || !channel.parentId) return;

      if (inactivityTimers.has(channel.id)) clearTimeout(inactivityTimers.get(channel.id));

      await safeRename(channel, async () => {
        if (channel.parentId === CATEGORY_2) {
          await channel.setParent(CATEGORY_1, { lockPermissions: false });
          console.log(`🔄 Webhook mới → ${channel.name} về danh mục hoạt động`);
        }
        await renameChannelByCategory(channel);
      });

      // Đặt timer 1 ngày không webhook
      const timer = setTimeout(async () => {
        try {
          await safeRename(channel, async () => {
            if (channel.parentId === CATEGORY_1) {
              await channel.setParent(CATEGORY_2, { lockPermissions: false });
              await renameChannelByCategory(channel);
              console.log(`💤 ${channel.name} không hoạt động 24h → chuyển danh mục ngủ`);
            }
          });
        } catch (err) {
          console.error("❌ Timer lỗi:", err.message);
        }
      }, INACTIVITY_TIME);

      inactivityTimers.set(channel.id, timer);

    } catch (err) {
      console.error("❌ messageCreate lỗi:", err.message);
    }
  });

  // ===============================
  // 🆕 Khi channel được tạo
  // ===============================
  client.removeAllListeners("channelCreate");
  client.on("channelCreate", async (channel) => {
    try {
      await safeRename(channel, async () => {
        await renameChannelByCategory(channel);

        // Nếu tạo trong danh mục hoạt động → add role
        if (channel.parentId === CATEGORY_1 && channel.topic) {
          const [userId] = channel.topic.split(" ");
          try {
            const member = await channel.guild.members.fetch(userId);
            const role = channel.guild.roles.cache.get(AUTO_ROLE_ID);
            if (member && role && !member.roles.cache.has(role.id)) {
              await member.roles.add(role);
              console.log(`✅ Thêm role cho ${member.user.tag} (${userId})`);
            }
          } catch (err) {
            console.warn(`⚠️ Không thể add role cho ID ${userId}`);
          }
        }
      });

      // Nếu nằm trong danh mục hoạt động → đặt timer chuyển sang ngủ
      if (channel.parentId === CATEGORY_1) {
        const timer = setTimeout(async () => {
          try {
            await safeRename(channel, async () => {
              await channel.setParent(CATEGORY_2, { lockPermissions: false });
              await renameChannelByCategory(channel);
              console.log(`💤 ${channel.name} không hoạt động 24h → chuyển danh mục ngủ`);
            });
          } catch (err) {
            console.error("❌ Timer channelCreate lỗi:", err.message);
          }
        }, INACTIVITY_TIME);
        inactivityTimers.set(channel.id, timer);
      }

    } catch (err) {
      console.error("❌ channelCreate lỗi:", err.message);
    }
  });

  // ===============================
  // ⚙️ Khi kênh đổi danh mục (thủ công hoặc bot)
  // ===============================
  client.removeAllListeners("channelUpdate");
  client.on("channelUpdate", async (oldCh, newCh) => {
    try {
      if (!newCh || newCh.type !== 0) return;
      if (oldCh.parentId !== newCh.parentId) {
        await safeRename(newCh, async () => {
          await renameChannelByCategory(newCh);
          console.log(`🪄 ChannelUpdate: ${newCh.name} đổi danh mục`);
        });
      }
    } catch (err) {
      console.error("❌ channelUpdate lỗi:", err.message);
    }
  });

  // ===============================
  // ❌ Khi channel bị xóa → dọn timer
  // ===============================
  client.removeAllListeners("channelDelete");
  client.on("channelDelete", (channel) => {
    if (inactivityTimers.has(channel.id)) {
      clearTimeout(inactivityTimers.get(channel.id));
      inactivityTimers.delete(channel.id);
    }
    renameQueue.delete(channel.id);
  });
};
