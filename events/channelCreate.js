module.exports = (client, CATEGORY_ID, ROLE_ID, renameChannel) => {
  client.on("channelCreate", async (channel) => {
    try {
      // Chỉ xử lý trong category được config
      if (channel.parentId !== CATEGORY_ID) return;

      // Rename kênh
      await renameChannel(channel, CATEGORY_ID);

      // Auto add role cho user nếu có userId trong topic
      if (!channel.topic) return;
      const match = channel.topic.match(/(\d{17,19})$/);
      if (!match) return;

      const userId = match[1];
      const member = await channel.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      await member.roles.add(ROLE_ID).catch(() => {});
      console.log(`✅ Đã add role ${ROLE_ID} cho ${member.user.tag}`);
    } catch (err) {
      console.error("❌ Lỗi channelCreate event:", err);
    }
  });
};
