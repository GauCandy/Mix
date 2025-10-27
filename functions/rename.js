const CATEGORY_ACTIVE = process.env.CATEGORY_ACTIVE;
const CATEGORY_SLEEP = process.env.CATEGORY_SLEEP;

async function renameChannelByCategory(channel) {
  try {
    if (!channel || !channel.name) return;

    let newName = channel.name;

    if (channel.parentId === CATEGORY_ACTIVE) {
      // Danh mục hoạt động
      if (!channel.name.includes("★")) {
        newName = `🛠★${channel.name.replace(/^(\W|★)+/, "")}`;
      }
    } else if (channel.parentId === CATEGORY_SLEEP) {
      // Danh mục ngủ
      newName = channel.name.replace(/^🛠★/, "");
    }

    if (newName !== channel.name) {
      await channel.setName(newName).catch(() => {});
      console.log(`✏️ Rename: ${channel.name} → ${newName}`);
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannelByCategory:", err);
  }
}

module.exports = { renameChannelByCategory };
