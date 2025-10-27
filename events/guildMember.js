const { updateMemberRoles } = require("../functions/updateRoles");
const queue = new Map(); // Queue xử lý từng user

module.exports = client => {
  client.on("guildMemberAdd", member => {
    console.log(`✅ [JOIN] ${member.user.tag} đã vào server`);
    updateMemberRoles(member);
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      // 🧭 Luôn fetch lại roles mới nhất
      await newMember.fetch(true).catch(() => {});

      const oldRoles = [...oldMember.roles.cache.keys()];
      const newRoles = [...newMember.roles.cache.keys()];
      const lostRoles = oldRoles.filter(id => !newRoles.includes(id));
      const gainedRoles = newRoles.filter(id => !oldRoles.includes(id));

      if (!lostRoles.length && !gainedRoles.length) return;

      console.log(`🔄 [UPDATE] ${newMember.user.tag}`);
      if (lostRoles.length) console.log(`🧹 Mất roles: ${lostRoles.join(", ")}`);
      if (gainedRoles.length) console.log(`✨ Nhận roles: ${gainedRoles.join(", ")}`);

      // 🧠 Gom request theo user để tránh nghẽn
      const userId = newMember.id;
      if (!queue.has(userId)) queue.set(userId, Promise.resolve());

      const last = queue.get(userId);
      const next = (async () => {
        // Chờ 300ms giữa mỗi lần để tránh API spam
        await last.catch(() => {});
        await new Promise(r => setTimeout(r, 300));
        await updateMemberRoles(newMember);
      })();

      queue.set(userId, next);
    } catch (err) {
      console.error(`❌ [guildMemberUpdate] Lỗi khi xử lý ${newMember.user?.tag}:`, err);
    }
  });
};
