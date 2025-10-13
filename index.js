// ===============================
// 🧠 CACHE MANAGER TÍCH HỢP
// ===============================
const { loadCache, saveCache } = require('./utils/cacheManager');

// ✅ Khi bot khởi động → tải lại cache
loadCache();

// ✅ Khi bot tắt → tự động lưu cache
process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(); });
process.on('SIGTERM', () => { saveCache(); process.exit(); });


// ===============================
// 🤖 DISCORD BOT CHÍNH
// ===============================
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

// === Import auto role updater (tùy chọn) ===
const { initRoleUpdater } = require("./functions/updateRoles"); // ⚙️ file riêng cho logic auto role

// ==== Tạo Discord client ====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Quản lý server
    GatewayIntentBits.GuildMembers,     // Theo dõi member join/leave
    GatewayIntentBits.GuildMessages,    // Theo dõi tin nhắn
    GatewayIntentBits.MessageContent,   // Đọc nội dung tin nhắn
    GatewayIntentBits.GuildPresences,   // Theo dõi trạng thái online/offline
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
  ],
});

client.commands = new Collection();


// ===============================
// 📦 LOAD COMMANDS
// ===============================
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
  for (const file of commandFiles) {
    try {
      const command = require(`./commands/${file}`);
      if (command.data && command.data.name) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`⚠️ Command ${file} thiếu "data.name"`);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi load command ${file}:`, err);
    }
  }
} else {
  console.warn("⚠️ Không tìm thấy thư mục 'commands'");
}


// ===============================
// ⚙️ LOAD EVENTS
// ===============================
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
  for (const file of eventFiles) {
    try {
      const event = require(`./events/${file}`);
      if (typeof event === "function") {
        event(client);
        console.log(`✅ Loaded event: ${file}`);
      } else {
        console.warn(`⚠️ Event ${file} không export function`);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi load event ${file}:`, err);
    }
  }
} else {
  console.warn("⚠️ Không tìm thấy thư mục 'events'");
}


// ===============================
// 🟢 BOT ONLINE
// ===============================
client.once("ready", async () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
  if (typeof initRoleUpdater === 'function') {
    await initRoleUpdater(client); // 🔁 chạy auto role updater
  }
});


// ===============================
// 🌐 KEEP ALIVE SERVER (cho hosting free như Replit, Render)
// ===============================
const app = express();
app.get("/", (req, res) => res.send("Bot vẫn online! ✅"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Keep-alive server chạy"));


// ===============================
// ⚠️ HANDLER: GIỮ BOT KHÔNG BỊ “NGỦ”
// ===============================

// Khi Discord bị disconnect / lỗi / reconnect, sẽ log ra console
client.on("reconnecting", () => console.warn("🔁 Discord client reconnecting..."));
client.on("resume", (replayed) => console.log(`🔄 Reconnected, replayed ${replayed} events.`));
client.on("error", (err) => console.error("❌ Discord client error:", err));
client.on("disconnect", (event) => console.warn("⚠️ Discord client disconnected:", event));
client.on("shardError", (error) => console.error("💥 Websocket shard error:", error));
client.on("shardDisconnect", (event, shardId) => console.warn(`⚠️ Shard ${shardId} disconnected:`, event));

// Xử lý lỗi toàn cục (ngăn node treo ngầm)
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
  // Có thể tự restart sau 2 giây (Render sẽ khởi động lại)
  setTimeout(() => process.exit(1), 2000);
});

// Auto-check mỗi 60s để phát hiện bot treo hoặc disconnect
setInterval(() => {
  try {
    if (!client || !client.uptime) {
      console.warn("⏰ client.uptime missing — forcing restart");
      return process.exit(1);
    }

    const ping = client.ws?.ping;
    if (typeof ping === "number" && ping > 10000) {
      console.warn(`⏰ High gateway ping (${ping} ms). Restarting...`);
      return process.exit(1);
    }
  } catch (err) {
    console.error("Lỗi trong health-check interval:", err);
    process.exit(1);
  }
}, 60_000);


// ===============================
// 🔑 LOGIN DISCORD
// ===============================
client.login(process.env.TOKEN);
