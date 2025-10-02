// deployCommands.js
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Hiện thông tin trợ giúp cơ bản"),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report một thành viên vi phạm")
    .addUserOption(option =>
      option.setName("member")
        .setDescription("Chọn thành viên cần report")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Lý do report")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Xóa commands cũ...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log("✅ Đã xóa tất cả commands cũ.");

    console.log("⏳ Đăng ký commands mới...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Đã đăng ký /help và /report.");
  } catch (error) {
    console.error(error);
  }
})();
