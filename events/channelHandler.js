const { renameChannel } = require("../functions/rename");

const CATEGORY_ID = process.env.CATEGORY_ID;   // ID category chứa channel
const ROLE_ID = process.env.AUTO_ROLE_ID;      // Role auto add khi tạo channel

// Map lưu timer cho từng channel
const channelTimers = new Map();

module.exports = (client) => {
  // ====== Khi channel mới được tạo ======
  client.on("channelCreate", async (channel) => {
    try {
      if (channel.parentId !== CATEGORY_ID) return;

      // Đổi tên channel (nếu bạn có function rename)
      await renameChannel(channel, CATEGORY_ID);

      // Lấy userId trong topic
      if (!channel.topic) return;
      const match = channel.topic.match(/(\d{17,19})$/);
      if (!match) return;

      const userId = match[1];
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      // Thêm role cho đúng user
      await member.roles.add(ROLE_ID).catch(() => {});
      console.log(`✅ Đã add role ${ROLE_ID} cho ${member.user.tag} khi tạo channel`);
    } catch (err) {
      console.error("❌ Lỗi channelCreate:", err);
    }
  });

  // ====== Khi có tin nhắn mới trong channel ======
  client.on("messageCreate", async (message) => {
    try {
      const channel = message.channel;
      if (channel.parentId !== CATEGORY_ID) return;

      // Lấy userId trong topic
      if (!channel.topic) return;
      const match = channel.topic.match(/(\d{17,19})$/);
      if (!match) return;

      const userId = match[1];
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      // Nếu là webhook thì giữ channel mở 3 ngày, còn user thì 8h
      const isWebhookMsg = !!message.webhookId;
      const duration = isWebhookMsg ? 3 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;

      // Reset timer cũ (nếu có)
      if (channelTimers.has(channel.id)) {
        clearTimeout(channelTimers.get(channel.id));
      }

      // Set timer mới
      const timer = setTimeout(async () => {
        try {
          await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { ViewChannel: false });

          // Xóa role đã add cho đúng chủ channel
          if (member.roles.cache.has(ROLE_ID)) {
            await member.roles.remove(ROLE_ID).catch(() => {});
            console.log(`❌ Đã gỡ role ${ROLE_ID} của ${member.user.tag} khi channel hết hạn`);
          }

          console.log(`⏳ Channel ${channel.name} đã bị ẩn sau ${isWebhookMsg ? "3 ngày" : "8 giờ"}`);
        } catch (err) {
          console.error("❌ Lỗi khi ẩn channel:", err);
        }
      }, duration);

      channelTimers.set(channel.id, timer);

      // Nếu có tin nhắn webhook → mở lại ngay lập tức
      if (isWebhookMsg) {
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { ViewChannel: true });
        console.log(`✅ Channel ${channel.name} mở lại do có webhook mới`);
      }

    } catch (err) {
      console.error("❌ Lỗi messageCreate:", err);
    }
  });
};
