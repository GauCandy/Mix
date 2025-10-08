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

// ==== Khởi tạo client ====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences, // Theo dõi trạng thái online/offline
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();

// ==== Load commands ====
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command);
    }
  }
}

// ==== Load events ====
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));
  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (typeof event === "function") event(client);
  }
}

// ==== Hệ thống tự động Role ====
const { initRoleUpdater } = require("./functions/updateRoles");
initRoleUpdater(client);

// ==== Khi bot online ====
client.once("ready", () => {
  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
});

// ==== Keep Alive ====
const app = express();
app.get("/", (req, res) => res.send("✅ Bot vẫn online!"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Keep-alive server chạy")
);

// ==== Login ====
client.login(process.env.TOKEN);
