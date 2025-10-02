async function renameChannel(channel) {
  try {
    if (!channel.isTextBased()) return;
    if (!channel.topic) return;

    const match = channel.topic.match(/(\d{17,19})$/);
    if (!match) return;

    const userId = match[1];
    const member = await channel.guild.members.fetch(userId);
    if (member) {
      await channel.setName(member.user.username).catch(() => {});
      console.log(`✏️ Đã đổi tên kênh thành ${member.user.username}`);
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannel:", err);
  }
}
module.exports = { renameChannel };
