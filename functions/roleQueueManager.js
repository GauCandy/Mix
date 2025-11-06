// functions/roleQueueManager.js
const { updateMemberRoles } = require("./updateRoles");

const queue = new Map();

// Quản lý chuỗi xử lý từng user
function queueMember(member) {
  if (!member || !member.id) return;

  const userId = member.id;
  const previous = queue.get(userId) || Promise.resolve();

  const next = (async () => {
    await previous.catch(() => {});
    await updateMemberRoles(member);
    await new Promise(res => setTimeout(res, 300)); // nghỉ 300ms để tránh spam API
  })();

  queue.set(userId, next);
}

module.exports = { queueMember };
