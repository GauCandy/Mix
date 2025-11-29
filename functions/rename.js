// functions/rename.js
async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943"; // Danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088"; // Danh mục ngủ

    if (!channel) return;

    // Lấy username từ topic (giữ như trước)
    const topic = channel.topic || "";
    const username = topic.split(" ")[0];
    if (!username) return;

    // Chọn tiền tố muốn thay
    let prefix = null;
    if (channel.parentId === CATEGORY_1) prefix = "🛠★】";
    else if (channel.parentId === CATEGORY_2) prefix = "⏰★】";
    else return;

    // Nếu tên hiện tại có '】', giữ phần sau '】' nguyên vẹn (suffix)
    let suffix = "";
    if (channel.name && channel.name.includes("】")) {
      suffix = channel.name.split("】").slice(1).join("】"); // phần sau dấu '】' (giữ nguyên)
      // Nếu suffix không chứa username thì đảm bảo username xuất hiện ở đầu suffix
      if (!suffix.includes(username)) {
        suffix = `${username}-${suffix}`;
      }
    } else {
      // fallback: tạo suffix mặc định
      suffix = `${username}-macro`;
    }

    // Kết hợp prefix + suffix (giữ mọi kí tự phía sau nguyên vẹn)
    const newName = `${prefix}${suffix}`;

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

module.exports = { renameChannelByCategory };
