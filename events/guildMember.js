const { updateMemberRoles } = require("../functions/updateRoles");

const queue = new Map(); // lưu hàng đợi cho từng người

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

      // Bắt buộc fetch roles mới
      await newMember.fetch(true).catch(() => {});

      const oldRoles = [...oldMember.roles.cache.keys()];
      const newRoles = [...newMember.roles.cache.keys()];

      const lostRoles = oldRoles.filter(id => !newRoles.includes(id));
      const gainedRoles = newRoles.filter(id => !oldRoles.includes(id));

      if (lostRoles.length === 0 && gainedRoles.length === 0) return;

      console.log(`\n🔄 [UPDATE] ${newMember.user.tag}`);
      if (lostRoles.length) console.log(`🧹 Mất roles: ${lostRoles.join(", ")}`);
      if (gainedRoles.length) console.log(`✨ Nhận roles: ${gainedRoles.join(", ")}`);

      // Nếu đang có request đang chạy cho user này, thì thêm vào queue
      if (queue.has(newMember.id)) {
        queue.get(newMember.id).push(() => updateMemberRoles(newMember));
        return;
      }

      // Nếu chưa có hàng đợi thì tạo mới
      queue.set(newMember.id, []);
      await updateMemberRoles(newMember);

      // Sau khi xong, kiểm tra xem còn request chờ không
      while (queue.get(newMember.id).length > 0) {
        const next = queue.get(newMember.id).shift();
        await new Promise(res => setTimeout(res, 1000)); // nghỉ 1s tránh rate limit
        await next();
      }

      queue.delete(newMember.id);
    } catch (err) {
      console.error(`❌ [guildMemberUpdate] Lỗi khi xử lý ${newMember.user?.tag}:`, err);
    }
  });
};
