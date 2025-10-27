// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943";              // 🛠 danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088";       // ⏰ danh mục ngủ

    if (!channel || !channel.topic) return;
    const [username] = channel.topic.split(" ");
    if (!username) return;

    if (channel.parentId === CATEGORY_1) {
      const newName = `🛠★】${username}-macro`;
      await channel.setName(newName).catch(() => {});
      console.log(`✅ Đổi tên: ${channel.name} → ${newName} (vào danh mục 1)`);
    }

    else if (channel.parentId === CATEGORY_2) {
      const newName = `⏰★】${username}-macro`;
      await channel.setName(newName).catch(() => {});
      console.log(`🔵 Đổi tên: ${channel.name} → ${newName} (vào danh mục 2)`);
    }

  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

module.exports = { renameChannelByCategory };
