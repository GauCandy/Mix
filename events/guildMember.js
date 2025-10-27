const { updateMemberRoles } = require("../functions/updateRoles");

module.exports = client => {
  // Khi thành viên mới vào server
  client.on("guildMemberAdd", async member => {
    if (!member || member.user?.bot) return;
    console.log(`✅ [JOIN] ${member.user.tag} đã vào server`);
    await updateMemberRoles(member);
  });

  // Khi role bị thay đổi
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      if (!newMember || newMember.user?.bot) return;

      // Bắt buộc fetch lại roles mới để đảm bảo chính xác
      await newMember.fetch(true).catch(() => {});

      const oldRoles = [...oldMember.roles.cache.keys()];
      const newRoles = [...newMember.roles.cache.keys()];

      const lostRoles = oldRoles.filter(id => !newRoles.includes(id));
      const gainedRoles = newRoles.filter(id => !oldRoles.includes(id));

      // Nếu không có thay đổi roles thì bỏ qua
      if (lostRoles.length === 0 && gainedRoles.length === 0) return;

      // In log đẹp và dễ nhìn
      console.log(`\n🔄 [UPDATE] ${newMember.user.tag}`);
      if (lostRoles.length) console.log(`🧹 Mất roles: ${lostRoles.join(", ")}`);
      if (gainedRoles.length) console.log(`✨ Nhận roles: ${gainedRoles.join(", ")}`);

      // Giới hạn tốc độ xử lý để tránh spam (anti rate limit)
      newMember._lastUpdate = newMember._lastUpdate || 0;
      const now = Date.now();
      if (now - newMember._lastUpdate < 1500) {
        console.log(`⚠️ [SKIP] Bỏ qua ${newMember.user.tag} do cập nhật quá nhanh`);
        return;
      }
      newMember._lastUpdate = now;

      // Gọi hàm xử lý chính
      await updateMemberRoles(newMember);
    } catch (err) {
      console.error(`❌ [guildMemberUpdate] Lỗi khi xử lý ${newMember.user?.tag}:`, err);
    }
  });
};
