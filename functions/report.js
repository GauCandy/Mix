// functions/report.js
const { EmbedBuilder } = require("discord.js");

function createReportEmbed({ reporter, reported, reason, proof, channel }) {
  const embed = new EmbedBuilder()
    .setColor("#ff4747")
    .setTitle("🚨 New Report Submitted")
    .setThumbnail("https://cdn-icons-png.flaticon.com/512/564/564619.png")
    .setDescription(
      `Một báo cáo vi phạm vừa được gửi trong server.  
      Vui lòng kiểm tra chi tiết bên dưới:`
    )
    .addFields(
      { name: "👤 Reporter", value: reporter || "Unknown", inline: true },
      { name: "⚠️ Reported User", value: reported || "Unknown", inline: true },
      { name: "📄 Reason", value: reason || "Không có lý do", inline: false }
    )
    .setFooter({ text: "Moderation System | Auto-Report" })
    .setTimestamp();

  if (channel) {
    embed.addFields({ name: "📍 Channel", value: channel, inline: true });
  }

  if (proof) {
    embed.addFields({ name: "🖼 Proof / Evidence", value: `[Click Here](${proof})` });
    embed.setImage(proof);
  }

  return embed;
}

module.exports = { createReportEmbed };
