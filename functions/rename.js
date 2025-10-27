// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = process.env.CATEGORY_ID; // Danh mục 1
    const CATEGORY_2 = "1427958263281881088";   // Danh mục 2

    if (!channel || !channel.topic) return; // Không có topic thì bỏ qua

    // Tách username từ topic ("username iduser")
    const [username] = channel.topic.split(" ");
    if (!username) return;

    let newName;
    if (channel.parentId === CATEGORY_1) {
      newName = `🛠★】${username}-macro`;
    } else if (channel.parentId === CATEGORY_2) {
      newName = `⏰★】${username}-macro`;
    } else {
      return; // Không thuộc 2 danh mục cần theo dõi
    }

    if (channel.name !== newName) {
      await channel.setName(newName);
      console.log(`✅ Đổi tên: ${channel.name} → ${newName}`);
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

module.exports = { renameChannelByCategory };
