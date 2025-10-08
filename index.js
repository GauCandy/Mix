// ====== Discord Bot ======
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

// === Role updater import ===
const { initRoleUpdater } = require("./functions/updateRoles"); // 👈 thêm dòng này

// ==== Khởi tạo client ====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Quản lý server
    GatewayIntentBits.GuildMembers,     // Lấy danh sách thành viên
    GatewayIntentBits.GuildMessages,    // Theo dõi tin nhắn
    GatewayIntentBits.MessageContent,   // Đọc nội dung tin nhắn
    GatewayIntentBits.GuildPresences,   // Theo dõi online/offline
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
  ],
});

client.commands = new Collection();

// ==== Load commands ====
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.data.name) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ Command ${file} thiếu "data.name"`);
  }
}

// ==== Load events ====
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (typeof event === "function") {
    event(client);
    console.log(`✅ Loaded event: ${file}`);
  } else {
    console.warn(`⚠️ Event ${file} không export function`);
  }
}

// ==== Khi bot online ====
client.once("ready", async () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
  await initRoleUpdater(client); // 👈 Thêm dòng này để chạy role check khi bot online
});

// ==== Keep Alive (cho hosting free, ví dụ Replit) ====
const app = express();
app.get("/", (req, res) => res.send("Bot vẫn online! ✅"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Keep-alive server chạy")
);

// ==== Login ====
client.login(process.env.TOKEN);
