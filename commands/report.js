// commands/report.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID; // đặt trong .env

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Báo cáo vi phạm trong server")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Người bạn muốn báo cáo")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Lý do báo cáo")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("proof")
        .setDescription("Bằng chứng (link hình ảnh/video nếu có)")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const reportedUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const proof = interaction.options.getString("proof") || "Không có";
      const reporter = interaction.user;
      const channel = interaction.channel;

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🚨 New Report Submitted")
        .setDescription(
          "Một báo cáo vi phạm vừa được gửi trong server.\nVui lòng kiểm tra chi tiết bên dưới:"
        )
        .addFields(
          { name: "👤 Reporter", value: reporter.tag, inline: true },
          { name: "⚠️ Reported User", value: reportedUser.tag, inline: true },
          { name: "📄 Reason", value: reason, inline: false },
          { name: "📎 Proof", value: proof, inline: false },
          { name: "📍 Channel", value: `${channel}`, inline: false }
        )
        .setFooter({
          text: "Moderation System | Auto-Report",
        })
        .setTimestamp();

      // Gửi vào kênh report
      const reportChannel = await interaction.client.channels.fetch(REPORT_CHANNEL_ID);
      if (reportChannel) {
        await reportChannel.send({ embeds: [embed] });
      }

      // Trả lời riêng cho người dùng
      await interaction.reply({
        content: `✅ Báo cáo của bạn về **${reportedUser.tag}** đã được gửi.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("❌ Lỗi khi xử lý lệnh /report:", err);
      await interaction.reply({
        content: "❌ Đã xảy ra lỗi khi gửi báo cáo.",
        ephemeral: true,
      });
    }
  },
};
