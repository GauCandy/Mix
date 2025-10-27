// functions/rename.js
const { setTimeout: wait } = require("node:timers/promises");

async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943";
    const CATEGORY_2 = "1427958263281881088";

    if (!channel?.topic) return;
    const [username] = channel.topic.split(" ");
    if (!username) return;

    let expectedName;
    if (channel.parentId === CATEGORY_1) expectedName = `🛠★】${username}-macro`;
    else if (channel.parentId === CATEGORY_2) expectedName = `⏰★】${username}-macro`;
    else return;

    if (channel.name === expectedName) return;

    const oldName = channel.name;

    // ✅ Thử rename 2 lần, delay nhẹ nếu Discord chưa kịp cập nhật
    for (let i = 1; i <= 2; i++) {
      try {
        await channel.setName(expectedName);
        console.log(`✅ Đổi tên: ${oldName} → ${expectedName}`);
        break;
      } catch (err) {
        console.warn(`⚠️ Rename lỗi (lần ${i}):`, err.message);
        await wait(1000); // chờ 1 giây rồi thử lại
      }
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

module.exports = { renameChannelByCategory };
