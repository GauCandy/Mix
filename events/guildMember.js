const { queueMember } = require("../functions/roleQueueManager");
const { updateMemberRoles } = require("../functions/updateRoles");
const queue = new Map(); // Gom request theo user để tránh spam API

module.exports = client => {
  // Khi thành viên mới vào server
  client.on("guildMemberAdd", member => {
    console.log(`✅ [JOIN] ${member.user.tag} đã vào server`);
    queueMember(member); // dùng queueMember thay vì updateMemberRoles trực tiếp
  });

  // Khi roles của thành viên thay đổi
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      await newMember.fetch(true).catch(() => {});

      const oldRoles = [...oldMember.roles.cache.keys()];
      const newRoles = [...newMember.roles.cache.keys()];
      const lostRoles = oldRoles.filter(id => !newRoles.includes(id));
      const gainedRoles = newRoles.filter(id => !oldRoles.includes(id));

      if (!lostRoles.length && !gainedRoles.length) return;

      console.log(`🔄 [UPDATE] ${newMember.user.tag}`);
      if (lostRoles.length) console.log(`🧹 Mất roles: ${lostRoles.join(", ")}`);
      if (gainedRoles.length) console.log(`✨ Nhận roles: ${gainedRoles.join(", ")}`);

      const userId = newMember.id;

      if (!queue.has(userId)) queue.set(userId, Promise.resolve());
      const last = queue.get(userId);

      // 🧠 Đảm bảo mỗi user xử lý tuần tự, cách nhau 300ms
      const next = (async () => {
        await last.catch(() => {});
        await new Promise(r => setTimeout(r, 300));
        queueMember(newMember); // gọi queueManager (sẽ tự xử lý update)
      })();

      queue.set(userId, next);
    } catch (err) {
      console.error(`❌ [guildMemberUpdate] Lỗi khi xử lý ${newMember.user?.tag}:`, err);
    }
  });
};

