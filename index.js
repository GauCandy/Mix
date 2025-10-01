const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Partials,
} = require("discord.js");
require("dotenv").config();
const express = require("express");
const TOKEN = process.env.TOKEN;
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const CATEGORY_ID = process.env.CATEGORY_ID; // Category ID từ .env
const BASE_ROLE_ID = "1415319898468651008";
const WELCOME_CHANNEL_ID = "1411590263033561128"; // Channel rules

const BLOCK_ROLE_IDS = [
  "1411639327909220352","1411085492631506996","1418990676749848576","1410988790444458015",
  "1415322209320435732","1415351613534503022","1415350650165924002","1415320304569290862",
  "1415351362866380881","1415351226366689460","1415322385095332021","1415351029305704498",
  "1415350143800049736","1415350765291307028","1418990664762523718","1417802085378031689",
  "1417097393752506398","1420270612785401988","1420276021009322064","1415350457706217563",
  "1415320854014984342","1414165862205751326"
];

const AUTO_ROLE_ID = "1411240101832298569";
const REMOVE_IF_HAS_ROLE_ID = "1410990099042271352";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// ===== Tin nhắn rules chính (mainEmbed) =====
const mainEmbed = new EmbedBuilder()
  .setTitle("📜 Welcome to the Sol's RNG Community rules channel!")
  .setDescription(
`**This is where all the rules enforced on our Discord server are listed. Please read and follow them to ensure a pleasant experience for everyone!**

If there is anything confusing, you can go to the channel <#1411590263033561128> to contact the server administrators and ask questions.

⚠️ Warning Point & Punishment System:
\`\`\`
 • 1 Warning Point  = no punishment  
 • 2 Warning Points = 1h Mute 
 • 3 Warning Points = 12h Mute 
 • 4 Warning Points = 1d Mute 
 • 5 Warning Points = A ban 
 • Warning Points expire after 30 days
\`\`\`

-# Thank you for reading and following! We always strive to develop the most civilized and prosperous Sol's RNG community in Southeast Asia!`
  )
  .setColor(0x2f3136)
  .setImage("https://media.discordapp.net/attachments/1411987904980586576/1412916875163209901/SOLS_RNG_COUMUNICATION.png")
  .setFooter({ text: "Sol's RNG Community" })
  .setTimestamp();

// ===== Hàm đổi nickname & role =====
function cleanNickname(name) {
  return name.replace(/[^\p{L}\p{N}_]/gu, "").trim();
}

async function updateMemberRolesAndNick(member) {
  if (member.user.bot) return;

  const hasBaseRole = member.roles.cache.has(BASE_ROLE_ID);
  const hasAnyBlockRole = member.roles.cache.some(r => BLOCK_ROLE_IDS.includes(r.id));

  if (!hasBaseRole && !hasAnyBlockRole) {
    await member.roles.add(BASE_ROLE_ID).catch(() => {});
  } else if (hasBaseRole && hasAnyBlockRole) {
    await member.roles.remove(BASE_ROLE_ID).catch(() => {});
  }

  const hasAutoRole = member.roles.cache.has(AUTO_ROLE_ID);
  const hasRemoveRole = member.roles.cache.has(REMOVE_IF_HAS_ROLE_ID);

  if (!hasAutoRole && !hasRemoveRole) {
    await member.roles.add(AUTO_ROLE_ID).catch(() => {});
  } else if (hasAutoRole && hasRemoveRole) {
    await member.roles.remove(AUTO_ROLE_ID).catch(() => {});
  }

  let baseName = member.displayName.replace(/「.*?」/g, "").trim();
  baseName = cleanNickname(baseName);

  if (baseName && baseName !== member.displayName && baseName.length <= 32) {
    await member.setNickname(baseName).catch(() => {});
    console.log(`✏️ Đã đổi tên: ${member.user.tag} -> ${baseName}`);
  }
}

// ===== Hàm đổi tên channel webhook =====
async function renameChannel(channel) {
  if (channel.parentId !== CATEGORY_ID) return;
  if (!channel.name.endsWith("-webhook")) return;

  const username = channel.name.replace("-webhook", "");
  const newName = `🛠★】${username}-macro`;

  if (channel.name !== newName) {
    try {
      await channel.setName(newName);
      console.log(`✅ Đã đổi tên: ${channel.name} → ${newName}`);
    } catch (err) {
      console.error(`❌ Lỗi đổi tên ${channel.id}:`, err);
    }
  }
}

// ===== Sự kiện bot =====
client.once("ready", async () => {
  console.log(`✅ Bot đã đăng nhập dưới tên ${client.user.tag}`);

  // Gửi mainEmbed lần đầu khi bot khởi động
  const rulesChannel = client.channels.cache.get(WELCOME_CHANNEL_ID);
  if (rulesChannel) {
    await rulesChannel.send({ embeds: [mainEmbed] }).catch(() => {});
  }
});

client.on("guildMemberAdd", updateMemberRolesAndNick);
client.on("guildMemberUpdate", (_, newMember) => updateMemberRolesAndNick(newMember));
client.on("channelCreate", (channel) => renameChannel(channel));
client.on("channelUpdate", (_, channel) => renameChannel(channel));

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("?report")) {
    const args = message.content.split(" ").slice(1);
    const user = message.mentions.users.first();
    
    await message.delete().catch(() => {});

    if (!user) {
      return message.author.send("❌ Bạn phải tag người cần report!").catch(() => {});
    }

    const reason = args.slice(1).join(" ") || "Không có lý do.";

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🚨 Báo cáo vi phạm")
      .addFields(
        { name: "👤 Người bị report", value: `${user.tag}`, inline: true },
        { name: "📝 Lý do", value: reason, inline: true },
        { name: "📢 Người báo cáo", value: `${message.author.tag}`, inline: false }
      )
      .setFooter({ text: "Hãy xử lý sớm nhất có thể 🚔" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🔗 Jump to Message")
        .setStyle(ButtonStyle.Link)
        .setURL(message.url)
    );

    const reportChannel = client.channels.cache.get(REPORT_CHANNEL_ID);
    if (reportChannel) {
      await reportChannel.send({ embeds: [embed], components: [row] });
    }

    await message.author.send("✅ Báo cáo của bạn đã được gửi thành công và tin nhắn gốc đã được xoá.").catch(() => {});
  }
});

const app = express();
app.get("/", (req, res) => res.send("Bot vẫn online! ✅"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Keep-alive server chạy"));

client.login(TOKEN);
