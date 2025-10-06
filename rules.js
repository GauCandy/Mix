// ====== RULES CONFIG ======
module.exports = {
  opt1: {
    title: " **1 Warning Rules**",
    desc: `*Flooding/Spamming*\nDescription: Messages that occupy a large portion of the screen or involve excessive posting of irrelevant content.\n*Exceptions:* Informative messages\n(Additional 1 Hour mute)\n\n
*Excessive Begging*\nDescription: Repeatedly asking for favors, items, roles, or other benefits disruptively.\n*Exceptions:* Jokingly begging\n\n
*XP Farming*\nDescription: Sending messages solely to gain XP (Arcane bot).\nPunishments:\n1st Offense = reminder\n2nd Offense = Reduce XP\n3rd Offense = Level Reset`,
    color: "#ffffcc",
    image: "https://media.discordapp.net/attachments/1411987904980586576/1424797126034067586/standard_10.gif?ex=68e5413a&is=68e3efba&hm=1e7e6ea034fb156d1744afcca8a41aa67c3bfa260d2834ec98b55125d5c490f7&=&width=1214&height=70"
  },
  opt2: {
    title: " **Channel Misuses**",
    desc: `Channel misuses fall under the 1 Warning Rules category.\n\n
**Chatting Channel Misuse**\nUsing chat channels for non-chat purposes (e.g. bot commands outside Bots channel).\n\n
**Macro Channels Misuse**\nUsing macro category channels incorrectly.\nPunishments:\n1 Warn = Reminder\n2 Warn = 1 Day Blacklist\n3 Warn = 1 Week Blacklist\n\n
**Community Channels Misuse**\nUsing community section for inappropriate purposes.\nPunishments similar to above.\n\n
**Voice Channel Misuse**\nImproperly using voice channels (Additional 1h Mute)`,
    color: "#7fe390",
    image: "https://media.discordapp.net/attachments/1411987904980586576/1424797127669710991/standard_7.gif?ex=68e5413a&is=68e3efba&hm=65e0a6e36b5505a2ae0bb80151c8d7adaaa14f28284698884929767a2d60d7d6&=&width=1214&height=70"
  },
  opt3: {
    title: " **2 Warning Rules**",
    desc: `*Mod Bait*\nSending messages that appear punishable to provoke mods.\n\n
*Accusation w/o Evidence*\nMaking wrongful claims without proof.\n\n
*DM Harassment*\nHarassing members in DMs due to mutual server.\n\n
*Discrimination*\nHarmful stereotyping (race, gender, religion...). Severe cases → Hate Speech.\n\n
*Inappropriate/Suggestive Language*\nImplying sexual/offensive content.\n\n
*Toxicity*\nDisruptive behavior without exceptions.\n\n
*Advertising/Self Promotion*\nPromoting media for self-gain without permission.`,
    color: "#f0954b",
    image: "https://media.discordapp.net/attachments/1411987904980586576/1424797127132975185/standard_8.gif?ex=68e5413a&is=68e3efba&hm=221f73c9be91bc85ffe0ae191f4a7989a1ab72d8a18abf4c3240efd1b296e937&=&width=1214&height=70"
  },
  opt4: {
    title: " **3 Warning Rules**",
    desc: `**Mod Bait**\nTrying to trick mods with borderline messages.\n\n
**Accusation w/o Evidence**\nWrongful claims without evidence (severe = ban).\n\n
**DM Harassment**\nHarassing users via DMs from mutual server.\n\n
**Discrimination**\nExtreme harmful stereotyping (severe = Hate Speech).`,
    color: "#f4363f",
    image: "https://media.discordapp.net/attachments/1411987904980586576/1424797126462017546/standard_9.gif?ex=68e5413a&is=68e3efba&hm=7c9a400ef5cb3191766d2acda6c6a457e48aeb1a2f229b8f7192853dc7eb3874&=&width=1214&height=70"
  },
  opt5: {
    title: " **Instant Ban Rules**",
    desc: `*Punishment Evading*\nLeaving to avoid punishment.\n\n
*NSFW*\nPosting inappropriate sexual/explicit content.\n\n
*Hate Speech/Racism*\nPromoting extreme discrimination.\n\n
*Child Endangerment*\nAny act harming minors.\n\n
*Cybercrimes*\nIllegal activity online.\n\n
*Inappropriate Profile*\nOffensive/suggestive profile. Punishment = Kick → Ban if unchanged.`,
    color: "#f13bfe",
    image: "https://media.discordapp.net/attachments/1411987904980586576/1424797125581213886/standard_11.gif?ex=68e5413a&is=68e3efba&hm=6a6d7f9fe9c882285eb89816c4fc0fbcdbd22c0060e42bbc2ea2a758c3eea547&=&width=1214&height=70"
  }
};
