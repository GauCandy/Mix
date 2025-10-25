// events/reactionTimeout.js
const TARGET_MESSAGE_ID = "1431700852263096490";
const EXEMPT_USER_ID = "678344927997853742"; // user này KHÔNG bị xoá reaction
const REACTION_TIMEOUT = 20 * 1000; // 20 giây

module.exports = (client) => {
  // Khi bot khởi động xong
  client.once("ready", async () => {
    try {
      // Duyệt toàn bộ guilds bot có mặt
      for (const [, guild] of client.guilds.cache) {
        const channels = guild.channels.cache.filter(c => c.isTextBased());
        for (const channel of channels.values()) {
          try {
            // Tìm tin nhắn mục tiêu trong channel (có thể fetch lỗi nếu bot không có quyền)
            const msg = await channel.messages.fetch(TARGET_MESSAGE_ID).catch(() => null);
            if (!msg) continue;

            console.log(`🔍 Quét reaction tin nhắn ${TARGET_MESSAGE_ID} trong #${channel.name}`);

            // Duyệt qua từng reaction
            for (const reaction of msg.reactions.cache.values()) {
              const users = await reaction.users.fetch();
              for (const user of users.values()) {
                if (user.bot) continue;
                if (user.id === EXEMPT_USER_ID) continue; // không xoá người được miễn
                await reaction.users.remove(user.id).catch(() => {});
                console.log(`🧹 Xóa reaction ${reaction.emoji.name} của ${user.tag} (lúc khởi động)`);
              }
            }

            // Nếu đã tìm được tin nhắn, dừng tìm tiếp
            break;
          } catch (err) {
            continue;
          }
        }
      }

      console.log("✅ Đã quét xong reactions khi khởi động.");
    } catch (err) {
      console.error("❌ Lỗi khi quét reaction ban đầu:", err);
    }
  });

  // Khi người dùng thêm reaction
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;

      // Fetch nếu partial
      if (reaction.partial) await reaction.fetch().catch(() => {});
      if (reaction.message.partial) await reaction.message.fetch().catch(() => {});

      // Chỉ xử lý tin nhắn mục tiêu
      if (reaction.message.id !== TARGET_MESSAGE_ID) return;

      // Không xóa reaction của người được miễn
      if (user.id === EXEMPT_USER_ID) return;

      console.log(`🕒 ${user.tag} thêm ${reaction.emoji.name}, sẽ xóa sau 20s...`);

      setTimeout(async () => {
        try {
          const msg = await reaction.message.fetch();
          const updated = msg.reactions.resolve(reaction.emoji.name);
          if (!updated) return;

          await updated.users.remove(user.id);
          console.log(`🧹 Đã xóa reaction ${reaction.emoji.name} của ${user.tag} sau 20s`);
        } catch (err) {
          console.warn(`⚠️ Không thể xóa reaction của ${user.tag}:`, err.message);
        }
      }, REACTION_TIMEOUT);
    } catch (err) {
      console.error("❌ Lỗi trong messageReactionAdd:", err);
    }
  });
};
