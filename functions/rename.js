// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943"; // danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088"; // danh mục ngủ

    if (!channel || !channel.topic) return;

    const [username] = channel.topic.split(" ");
    if (!username) return;

    // Xác định tên mong muốn
    let expectedName;
    if (channel.parentId === CATEGORY_1) {
      expectedName = `🛠★】${username}-macro`;
    } else if (channel.parentId === CATEGORY_2) {
      expectedName = `⏰★】${username}-macro`;
    } else return;

    // Nếu khác với tên hiện tại (hoặc chưa đúng prefix) thì đổi
    if (!channel.name.includes(expectedName.split("】")[0])) {
      await channel.setName(expectedName).catch(() => {});
      console.log(`🔄 Đổi tên kênh: ${channel.name} → ${expectedName}`);
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

module.exports = { renameChannelByCategory };
