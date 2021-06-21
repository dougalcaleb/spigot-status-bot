# Spigot Status Bot
A Discord bot to keep tabs on your Spigot Minecraft server.

Tested on Spigot 1.16.5.

Get useful insights on the health and performance of your online Spigot server from anywhere through Discord.

Features:
- Shows online status (and last known time online when offline)
- Pings server to verify status
- Displays ticks per second and memory usage
- Displays online players
- Clean embed message format

Planned Features:
- Integrated webserver for POST requests instead of webhook

# Setup
Because I do not own the hardware to host this bot on multiple servers at a time, you will need to register your own Discord bot. However, this is very simple to do:
- Go to the [Discord Developer Portal](https://discord.com/developers/docs/intro).
- On the left side, go to Applications and click New Application at the top right. Walk through the steps to create your bot.
- Once your bot is created, copy and save your bot's Token (but be careful to keep it secret and secure).

Verify that your bot can be added to your server. To get the bot up and running:
- Extract the code from ```src/bot``` to the hardware you want to run it from.
- Place your token in the appropriate place in the file ```token.js```.
- Configure your settings in ```config.json```, and in your Discord server. (See [settings](#settings))
- Use ```npm start``` or ```node server.js``` to run your server. 

If you have done this correctly, you should see your bot's status on Discord change to "online" and a message should be sent in the supplied channel that shows your Minecraft server is currently offline, with an unknown last online time.

Next, add the plugin to your Spigot server:
- Place the .jar found in src/plugin into the ```plugins``` folder in your server.
- Run the server. Once it has finished booting up, shut down the server.
- Inside the ```plugins``` folder, there will be a new folder named ```ServerStatusHost```. In ```config.yml``` found in this folder, set the ```url``` option to be either the webhook you created in your Discord server earlier, or the address that your bot will run on if you are using the webserver option instead.
- Run the server again. If you have done this correctly, and your Discord bot is running, you should see the message update to reflect that the server is online. After a moment, the TPS and memory trackers will populate.

Congratulations, your Discord bot is ready for use.

This is what you should see: 

![Bot Message](/img/bot-message.png)

You are free to expand upon and modify the software provided, as detailed in the License.

# Settings
### Discord bot:

Setting | Type | Description
--------|------|------------
spigotServerAddress | string | Web address of the Spigot server
spigotServerPort | number | Port that the Spigot server is running on
verifyStatus | boolean | Toggles whether the bot will ping the Spigot server to verify that it is online or offline<br/> <details><summary>Expand description</summary>This option helps to verify that the server continues to run. In the event that the server encounters a catastrophic error (such as network failure or the computer shutting off), the update that the server has shut down will not be sent successfully. Regular verifications will ensure that an incorrect status is not being displayed. <br/><br/>If your server's port cannot be pinged, for security reasons or otherwise, disable this option.</details>
verifyInterval | number | The amount of time (in seconds) between verification pings to the server
verifyTimeout | number | The timeout (in millliseconds) that the bot will wait until a ping is considered unsuccessful
botChannel | string | The ID of the Discord channel that the bot should post its message to <br/> <details><summary>Expand description</summary>To get the ID, enable Discord's Developer Mode, then right click channel > "Copy ID"<br/><br/>Ensure that only the bot can send messages to this channnel  </details>
useWebhook | boolean | Sets the method used to recieve data from the Spigot server <br/><details><summary>Expand description</summary>- true: uses the Discord webhook <br/> - false: uses an integrated webserver <br/><br/>When using the webhook, you will need to set up a new private Discord channel for the webhook to send data to. <br/> - Create the channel and give view permissions only to the bot. Ensure nobody can send messages in the channel <br/> - Under the channel settings, click Integrations > Create Webhook. Configure the webhook as you see fit. Click Copy Webhook URL and save it. You will need it later for the plugin. <br/><br/> Only use the webserver method when you have a static web address that can be dedicated to the bot. The webserver cuts out the middleman of needing a dedicated Discord channel to send updates to, and instead sends POST requests directly to the bot.</details>
webhookChannel | string | The ID of the channel that the Spigot server will send updates to (if using the webhook method)
webserverPort | number | When using the webserver instead of a Discord webhook, the bot will open up this port for POST requests from your Spigot server

<br/>
<br/>

### Plugin:

Setting | Type | Description
--------|------|------------
url | string | The URL of the Discord channel webhook or of the Discord bot's webserver
reportRate | number | The amount of time (in seconds) between sending server health updates to the bot
