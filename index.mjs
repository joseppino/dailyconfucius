import { Client, GatewayIntentBits } from "discord.js";
import { getAllItems, getNewQuote, setStale } from "./DDB.js";

export const handler = async (event) => {
  const TOKEN = process.env.DISCORD_TOKEN;

  const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

  await discordClient.login(TOKEN);
  
  const quoteOfTheDay = await getNewQuote();
  const staled = await setStale(quoteOfTheDay.QuoteID.N);
  if(staled) {
    const registeredUsers = await getAllItems("DC_RegisteredUsers");
    for(const user of registeredUsers) {
      const channel = await discordClient.users.createDM(user.DiscordUserId.S);
      await channel.send(
        `Hello, ${channel.recipient.displayName}.\nYour quote for today:\n\n*${quoteOfTheDay.QuoteEn.S}*\n\n${quoteOfTheDay.QuotePinyin.S}\n\n${quoteOfTheDay.QuoteHanzi.S}`
      );
    }
  } else {
    throw new Error("Error: Issue staling quote...");
  }
  const response = {
    statusCode: 200,
    body: JSON.stringify('Function run successfully')
  };
  return response;
}