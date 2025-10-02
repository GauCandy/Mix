// Đổi tên channel khi tạo trong CATEGORY_ID
async function renameChannel(channel, CATEGORY_ID) {
  try {
    if (channel.parentId !== CATEGORY_ID) return;
    if (!channel.name.endsWith("-webhook")) return;

    const username = channel.name.replace("-webhook", "");
    const newName = `🛠★】${username}-macro`;

    if (channel.name !== newName) {
      await channel.setName(newName);
      console.log(`✅ Đổi tên kênh: ${channel.name} → ${newName}`);
    }
  } catch (err) {
    console.error("❌ Lỗi renameChannel:", err);
  }
}

module.exports = { renameChannel };
