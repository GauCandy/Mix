const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

async function sendMainMessage(channel) {
  if (!channel) return;

  const mainEmbed = new EmbedBuilder()
    .setTitle("📜 Welcome to the Sol's RNG Community rules channel!")
    .setDescription(`
**This is where all the rules enforced on our Discord server are listed. Please read and follow them to ensure a pleasant experience for everyone!**

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

-# Thank you for reading and following! We always strive to develop the most civilized and prosperous Sol's RNG community in Southeast Asia!
    `)
    .setColor(3092790)
    .setImage('https://media.discordapp.net/attachments/1411987904980586576/1412916875163209901/SOLS_RNG_COUMUNICATION.png');

  const menu = new StringSelectMenuBuilder()
    .setCustomId("rules_menu")
    .setPlaceholder("Select rules you would like to see")
    .addOptions([
      { label: "1 Warning Rules", value: "opt1", description: "Rule violations that will get you 1 warn.", emoji: "<:x1Warn:1420078766855819284>" },
      { label: "Channel Misuses", value: "opt2", description: "Channel Misuse rules that will get you 1 warn.", emoji: "<:channelmisuse:1416316766312857610>" },
      { label: "2 Warning Rules", value: "opt3", description: "Rule violations that will get you 2 warns.", emoji: "<:x2Warn:1416316781060161556>" },
      { label: "3 Warning Rules", value: "opt4", description: "Rule violations that will get you 3 warns.", emoji: "<:x3Warn:1416316796029374464>" },
      { label: "Instant Ban Rules", value: "opt5", description: "Rule violations that will get you a ban.", emoji: "<:instantban:1416316818297192510>" },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  await channel.send({ embeds: [mainEmbed], components: [row] }).catch(console.error);
}

module.exports = { sendMainMessage };
