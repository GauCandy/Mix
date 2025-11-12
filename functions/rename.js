// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943"; // Danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088"; // Danh mục ngủ

    if (!channel || !channel.topic) return;

    // 1. Phân tích tên người dùng (username) từ topic
    const [username] = channel.topic.split(" ");
    if (!username) return;

    // 2. Tìm phần mở rộng của tên kênh hiện tại
    // Tên kênh cũ có dạng: [Ký hiệu cũ] [username]-macro[Phần mở rộng]
    const baseName = `${username}-macro`;
    
    // Tìm vị trí bắt đầu của baseName trong tên kênh hiện tại
    const baseIndex = channel.name.indexOf(baseName);
    
    let extension = "";
    if (baseIndex !== -1) {
      // Lấy phần mở rộng, bao gồm khoảng trắng nếu có
      extension = channel.name.substring(baseIndex + baseName.length).trim();
      // Thêm lại khoảng trắng nếu extension không rỗng để phân tách
      if (extension) {
        extension = ` ${extension}`;
      }
    }
    
    let newPrefix;
    if (channel.parentId === CATEGORY_1) {
      newPrefix = "🛠★】";
    } else if (channel.parentId === CATEGORY_2) {
      newPrefix = "⏰★】";
    } else return; // Không nằm trong category cần xử lý

    // 3. Tạo tên mới: [Ký hiệu mới] + [username]-macro + [Phần mở rộng]
    const newName = `${newPrefix}${baseName}${extension}`;

    // 4. Thực hiện đổi tên nếu cần
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
