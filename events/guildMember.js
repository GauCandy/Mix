const { updateMemberRoles } = require("../functions/updateRoles");

module.exports = client => {
  client.on("guildMemberAdd", member => {
    console.log(`✅ [JOIN] ${member.user.tag} đã vào server`);
    updateMemberRoles(member);
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      // 🧭 Bắt buộc fetch lại để cập nhật roles chính xác
      await newMember.fetch(true).catch(() => {});

      // ✅ Khai báo oldRoles và newRoles
      const oldRoles = [...oldMember.roles.cache.keys()];
      const newRoles = [...newMember.roles.cache.keys()];

      const lostRoles = oldRoles.filter(id => !newRoles.includes(id));
      const gainedRoles = newRoles.filter(id => !oldRoles.includes(id));

      if (lostRoles.length > 0 || gainedRoles.length > 0) {
        console.log(`🔄 [UPDATE] ${newMember.user.tag}`);
        if (lostRoles.length) console.log(`🧹 Mất roles: ${lostRoles.join(", ")}`);
        if (gainedRoles.length) console.log(`✨ Nhận roles: ${gainedRoles.join(", ")}`);
      }

      await updateMemberRoles(newMember);
    } catch (err) {
      console.error(`❌ [guildMemberUpdate] Lỗi khi xử lý ${newMember.user?.tag}:`, err);
    }
  });
};
