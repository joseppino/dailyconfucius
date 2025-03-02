import { Client , Events, GatewayIntentBits } from "discord.js";
import { getAllItems, getNewQuote } from "./DDB.js";
import "dotenv/config";

const TOKEN = process.env.DISCORD_TOKEN;

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

discordClient.once(Events.ClientReady, async readyClient => {
  // console.log(`Ready Logged in as ${readyClient.user.tag}`);
  const quoteOfTheDay = await getNewQuote();
  const registeredUsers = await getAllItems("DC_RegisteredUsers");
  for(const user of registeredUsers) {
    const channel = await discordClient.users.createDM(user.DiscordUserId.S);
    await channel.send(
      `Hello, ${channel.recipient.displayName}.\nYour quote for today:\n\n>*${quoteOfTheDay.QuoteEn.S}*\n\n${quoteOfTheDay.QuotePinyin.S}\n\n${quoteOfTheDay.QuoteHanzi.S}`
    );
  }

  process.exit();
});

discordClient.login(TOKEN);