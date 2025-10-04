const { renameChannel } = require("../functions/rename");

const CATEGORY_ID = process.env.CATEGORY_ID;   // ID category chứa channel
const ROLE_ID = process.env.AUTO_ROLE_ID;      // Role auto add khi tạo channel
const TARGET_ROLES = ["1410990099042271352", "1411991634194989096"]; // 2 role bật/tắt ViewChannel

// Map lưu timer cho từng channel
const channelTimers = new Map();

module.exports = (client) => {

  // ===== Khi channel mới được tạo =====
  client.on("channelCreate", async (channel) => {
    try {
      if (channel.parentId !== CATEGORY_ID) return;

      await renameChannel(channel, CATEGORY_ID);

      if (!channel.topic) return;
      const match = channel.topic.match(/(\d{17,19})$/);
      if (!match) return;

      const userId = match[1];
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      await member.roles.add(ROLE_ID).catch(() => {});
      console.log(`✅ Đã add role ${ROLE_ID} cho ${member.user.tag} khi tạo channel`);
    } catch (err) {
      console.error("❌ Lỗi channelCreate:", err);
    }
  });

  // ===== Khi có tin nhắn mới trong channel =====
  client.on("messageCreate", async (message) => {
    try {
      const channel = message.channel;
      if (channel.parentId !== CATEGORY_ID) return;

      if (!channel.topic) return;
      const match = channel.topic.match(/(\d{17,19})$/);
      if (!match) return;

      const userId = match[1];
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      const isWebhookMsg = !!message.webhookId;

      // Kiểm tra xem có role target nào bị ẩn không
      const isHidden = TARGET_ROLES.some(roleId => {
        const ow = channel.permissionOverwrites.cache.get(roleId);
        return ow?.deny.has("ViewChannel");
      });

      // ===== Nếu là webhook → mở lại và đặt hẹn 3 ngày =====
      if (isWebhookMsg) {
        for (const roleId of TARGET_ROLES) {
          const role = channel.guild.roles.cache.get(roleId);
          if (role) {
            await channel.permissionOverwrites.edit(role, { ViewChannel: true }).catch(() => {});
          }
        }

        if (channelTimers.has(channel.id)) clearTimeout(channelTimers.get(channel.id));
        const timer = setTimeout(async () => {
          try {
            for (const roleId of TARGET_ROLES) {
              const role = channel.guild.roles.cache.get(roleId);
              if (role) {
                await channel.permissionOverwrites.edit(role, { ViewChannel: false }).catch(() => {});
              }
            }
            if (member.roles.cache.has(ROLE_ID)) {
              await member.roles.remove(ROLE_ID).catch(() => {});
            }
            console.log(`⏳ Channel ${channel.name} bị ẩn sau 3 ngày không có webhook`);
          } catch (err) {
            console.error("❌ Lỗi khi ẩn channel:", err);
          }
        }, 3 * 24 * 60 * 60 * 1000);

        channelTimers.set(channel.id, timer);
        console.log(`✅ Channel ${channel.name} mở lại do có webhook mới`);
      }

      // ===== Nếu là user → chỉ mở khi đang ẩn và đặt hẹn 8h =====
      else if (!isWebhookMsg && isHidden) {
        for (const roleId of TARGET_ROLES) {
          const role = channel.guild.roles.cache.get(roleId);
          if (role) {
            await channel.permissionOverwrites.edit(role, { ViewChannel: true }).catch(() => {});
          }
        }

        if (channelTimers.has(channel.id)) clearTimeout(channelTimers.get(channel.id));
        const timer = setTimeout(async () => {
          try {
            for (const roleId of TARGET_ROLES) {
              const role = channel.guild.roles.cache.get(roleId);
              if (role) {
                await channel.permissionOverwrites.edit(role, { ViewChannel: false }).catch(() => {});
              }
            }
            if (member.roles.cache.has(ROLE_ID)) {
              await member.roles.remove(ROLE_ID).catch(() => {});
            }
            console.log(`⏳ Channel ${channel.name} bị ẩn sau 8 giờ không hoạt động`);
          } catch (err) {
            console.error("❌ Lỗi khi ẩn channel:", err);
          }
        }, 8 * 60 * 60 * 1000);

        channelTimers.set(channel.id, timer);
        console.log(`✅ Channel ${channel.name} mở lại do user nhắn`);
      }

    } catch (err) {
      console.error("❌ Lỗi messageCreate:", err);
    }
  });

  // ===== Khi channel bị xóa =====
  client.on("channelDelete", async (channel) => {
    try {
      if (channel.parentId !== CATEGORY_ID) return;
      if (!channel.topic) return;

      const match = channel.topic.match(/(\d{17,19})$/);
      if (!match) return;

      const userId = match[1];
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      if (member.roles.cache.has(ROLE_ID)) {
        await member.roles.remove(ROLE_ID).catch(() => {});
        console.log(`🗑️ Channel ${channel.name} bị xóa → đã gỡ role ${ROLE_ID} khỏi ${member.user.tag}`);
      }

      if (channelTimers.has(channel.id)) {
        clearTimeout(channelTimers.get(channel.id));
        channelTimers.delete(channel.id);
      }
    } catch (err) {
      console.error("❌ Lỗi channelDelete:", err);
    }
  });
};
