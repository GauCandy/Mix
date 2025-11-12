// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943"; // Danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088"; // Danh mục ngủ

    if (!channel || !channel.topic) return;

    // 1. Lấy username từ topic
    const [username] = channel.topic.split(" ");
    if (!username) return;

    // 2. Xây dựng tên cơ sở (baseName)
    const baseName = `${username}-macro`;
    const currentName = channel.name;

    // 3. Tìm phần mở rộng (extension)
    // Tìm vị trí của baseName trong tên kênh hiện tại
    const baseIndex = currentName.indexOf(baseName);

    let extension = "";
    if (baseIndex !== -1) {
      // Nếu tìm thấy, lấy mọi thứ nằm SAU baseName
      extension = currentName.substring(baseIndex + baseName.length);
    }
    // Nếu không tìm thấy (baseIndex === -1), extension sẽ là ""
    // Điều này cũng xử lý trường hợp tên kênh bị sai và cần "sửa" lại

    // 4. Xác định ký hiệu mới (newPrefix)
    let newPrefix;
    if (channel.parentId === CATEGORY_1) {
      newPrefix = "🛠★】";
    } else if (channel.parentId === CATEGORY_2) {
      newPrefix = "⏰★】";
    } else {
      return; // Không phải category cần đổi tên
    }

    // 5. Tạo tên mới = [Ký hiệu mới] + [Tên cơ sở] + [Phần mở rộng]
    const newName = `${newPrefix}${baseName}${extension}`;

    // 6. Đổi tên nếu cần
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
