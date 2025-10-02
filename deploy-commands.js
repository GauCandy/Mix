const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Hiện hướng dẫn sử dụng bot"),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Báo cáo một người dùng")
    .addUserOption(option =>
      option.setName("member")
        .setDescription("Chọn người cần report")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Lý do report")
        .setRequired(true)),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 Bắt đầu deploy slash commands...");

    // Nếu test chỉ trong 1 server, dùng GUILD_ID
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Deploy lệnh slash thành công!");
  } catch (error) {
    console.error("❌ Lỗi deploy:", error);
  }
})();
