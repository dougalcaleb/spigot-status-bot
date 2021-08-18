# Spigot Status Bot
A Discord bot to help you keep tabs on your Spigot-based Minecraft server.

Tested on Spigot and PaperMC 1.17.1

Features:
- Shows online status
- Pings server to verify status
- Displays ticks per second and memory usage
- Displays online players
- Clean embed message format

# Setup
Because I do not own the hardware to host this bot on multiple servers at a time, you will need to register your own Discord bot. However, this is very simple to do:
- Go to the [Discord Developer Portal](https://discord.com/developers/docs/intro).
- On the left side, go to Applications and click New Application at the top right. Walk through the steps to create your bot.
- Once your bot is created, copy and save your bot's Token (but be careful to keep it secret and secure).

Verify that your bot can be added to your Discord server. To get the bot up and running:
- Extract the code from ```src/bot``` to the hardware you want to run it from.
- Place your token in the appropriate place in the config file.
- Configure your settings in the config file and in your Discord server. (See [settings](#settings))
- Use ```node bot.js``` in the terminal to run the bot. 

If you have done this correctly, you should see your bot's status on Discord change to "online" and a message should be sent in the supplied channel that shows your Minecraft server is currently offline, with an unknown last online time.

Next, add the plugin to your Minecraft server:
- Place the .jar found in ```src/plugin``` into the ```plugins``` folder in your server.
- Run the server. Once it has finished booting up, shut down the server. There will be an error in the console related to the plugin.
- Inside the ```plugins``` folder, there will be a new folder named ```ServerStatusHost```. In ```config.yml``` found in this folder, set the ```url``` option to be the webhook URL you created in your Discord server earlier.
- Run the server again. If you have done this correctly, and your Discord bot is running, you should see the message update to reflect that the server is online. After a moment, the TPS and memory trackers will populate.

Congratulations, your Discord bot is ready for use.

You are free to expand upon and modify the software provided, as detailed in the License.

# Settings
### Discord bot:

Setting | Type | Description
--------|------|------------
serverName | string | The name of the server that the Discord bot will display as its status
thumbnail | string | URL of an image to use for the embed's thumbnail
serverAddress | string | Web address of the Minecraft server
serverPort | number | Port that the Minecraft server is running on
verifyStatus | boolean | Toggles whether the bot will ping the Spigot server to verify that it is online or offline<br/> <details><summary>Expand description</summary><br/>This option helps to verify that the server continues to run. In the event that the server encounters a catastrophic error (such as network failure or the computer shutting off), the update that the server has shut down will not be sent successfully. Regular verifications will ensure that an incorrect status is not being displayed. <br/><br/>If your server's port cannot be pinged, for security reasons or otherwise, disable this option.</details>
verifyInterval | number | The amount of time (in seconds) between verification pings to the server
verificationTimeout | number | The timeout (in seconds) that the bot will wait until a ping is considered unsuccessful
botChannel | string | The ID of the Discord channel that the bot should post its message to <br/> <details><summary>Expand description</summary><br/>Ensure that only the bot can send messages to this channnel. Other messages will break the bot.<br/><br/>To get the ID, enable Discord's Developer Mode, then right click channel > "Copy ID".</details>
webhookChannel | string | The ID of the channel that the Minecraft server will send updates to
botToken | string | Your Discord bot's login token

<br/>
<br/>

### Plugin:

Setting | Type | Description
--------|------|------------
url | string | The URL of the Discord channel webhook or of the Discord bot's webserver
reportInterval | number | The amount of time (in seconds) between sending server health updates to the bot
