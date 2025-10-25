// events/reactionTimeout.js
const TARGET_MESSAGE_ID = "1431700852263096490";
const REACTION_TIMEOUT = 20 * 1000; // 20 giây

module.exports = (client) => {
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;

      // Nếu reaction chưa load đủ dữ liệu thì fetch
      if (reaction.partial) await reaction.fetch().catch(() => {});
      if (reaction.message.partial) await reaction.message.fetch().catch(() => {});

      // Chỉ xử lý tin nhắn đích
      if (reaction.message.id !== TARGET_MESSAGE_ID) return;

      console.log(`🕒 ${user.tag} thêm reaction ${reaction.emoji.name}, đếm 20s...`);

      // Chờ 20 giây
      setTimeout(async () => {
        try {
          // Fetch lại để đảm bảo còn reaction
          const msg = await reaction.message.fetch();
          const updatedReaction = msg.reactions.resolve(reaction.emoji.name);
          if (!updatedReaction) return;

          await updatedReaction.users.remove(user.id);
          console.log(`🧹 Đã xóa reaction của ${user.tag} sau 20s`);
        } catch (err) {
          console.warn(`⚠️ Không thể xóa reaction của ${user.tag}:`, err.message);
        }
      }, REACTION_TIMEOUT);
    } catch (err) {
      console.error("❌ Lỗi trong messageReactionAdd:", err);
    }
  });
};
