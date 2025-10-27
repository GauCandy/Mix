// functions/rename.js
const { setTimeout: wait } = require("node:timers/promises");

async function renameChannelByCategory(channel) {
  try {
    const CATEGORY_1 = "1411034825699233943"; // danh mục hoạt động
    const CATEGORY_2 = "1427958263281881088"; // danh mục ngủ

    // Kiểm tra channel và topic
    if (!channel?.topic) return;
    const [username] = channel.topic.split(" ");
    if (!username) return;

    // Xác định tên mong đợi
    let expectedName = null;
    let categoryLabel = "";

    if (channel.parentId === CATEGORY_1) {
      expectedName = `🛠★】${username}-macro`;
      categoryLabel = "danh mục 1 (hoạt động)";
    } else if (channel.parentId === CATEGORY_2) {
      expectedName = `⏰★】${username}-macro`;
      categoryLabel = "danh mục 2 (ngủ)";
    } else return;

    // Nếu tên đúng rồi thì thôi
    if (channel.name === expectedName) return;

    const oldName = channel.name;

    // === Đổi tên có delay và retry ===
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await channel.setName(expectedName);
        console.log(`✅ Đổi tên: ${oldName} → ${expectedName} (${categoryLabel})`);
        break; // thành công thì thoát
      } catch (err) {
        if (err.code === 50013) {
          console.warn(`⚠️ Bot không có quyền đổi tên kênh ${oldName}.`);
          break;
        }
        console.warn(`⏳ Lỗi khi đổi tên (lần ${attempt}):`, err.message);
        await wait(2000 * attempt); // chờ tăng dần: 2s, 4s, 6s
      }
    }

    // Giãn nhịp để tránh rate limit nếu đổi nhiều channel liên tiếp
    await wait(1000);

  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

module.exports = { renameChannelByCategory };
