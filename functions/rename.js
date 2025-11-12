// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943"; // Danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088"; // Danh mục ngủ

    if (!channel || !channel.topic) return;

    const [username] = channel.topic.split(" ");
    if (!username) return;

    let newPrefix;
    if (channel.parentId === CATEGORY_1) {
      newPrefix = "🛠★】";
    } else if (channel.parentId === CATEGORY_2) {
      newPrefix = "⏰★】";
    } else return;

    // Tên lý tưởng theo username
    const expectedBase = `${username}-macro`;

    // Lấy phần sau prefix (bỏ phần đầu như 🛠★】 hay ⏰★】)
    const baseName = channel.name.replace(/^([^\w]*)★】/, "");

    let newName;

    // Nếu tên hiện tại KHÔNG chứa đúng username (kênh mới tạo)
    if (!baseName.startsWith(expectedBase)) {
      newName = `${newPrefix}${expectedBase}`; // tạo mới theo username
    } else {
      // chỉ đổi prefix, giữ nguyên phần còn lại (vd: "x1🌸")
      const rest = baseName.slice(expectedBase.length).trim(); 
      newName = `${newPrefix}${expectedBase}${rest ? " " + rest : ""}`;
    }

    if (channel.name !== newName) {
      await channel.setName(newName).catch(() => {});
      console.log(`✅ Đổi tên: ${channel.name} → ${newName}`);
    } else {
      console.log(`⚙️ Giữ nguyên: ${channel.name}`);
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

const renaming = new Set();
async function safeRename(channel) {
  if (renaming.has(channel.id)) return;
  renaming.add(channel.id);
  try {
    await renameChannelByCategory(channel);
  } finally {
    renaming.delete(channel.id);
  }
}

module.exports = { renameChannelByCategory, safeRename };
