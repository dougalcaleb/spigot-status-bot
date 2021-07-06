const Discord = require("discord.js");
const utility = require("./utility");
const token = require("./token");
const fs = require("fs");
const express = require("express");

const app = express();
const client = new Discord.Client();

let config = {
   spigotServerAddress: "",
   spigotServerPort: 8080,
   verifyStatus: true,
   verifyInterval: 180,
   useWebhook: true,
   webhookChannel: "",
   webserverPort: 3000,
   botChannel: ""
}

let server = {
	lastOnline: 0,
	online: false,
	players: [],
	health: [],
	onlineColor: "0x00b7ff",
	offlineColor: "0xff0000",
};

let global = {
	pingInt: null,
	botChannel: null,
	lastMessage: null,
};

config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

/*
*==================================
* DISCORD BOT
*==================================
*/

// Event: on startup
client.once("ready", (c) => {
	console.log("MinecraftBot Ready!");

	// Get correct channel
	global.botChannel = client.channels.cache.get(config.botChannel);

	// Get message
	if (!global.lastMessage) {
		utility.fetchBotMessage(global.botChannel, (message) => {
			global.lastMessage = message;

			// Immediate verification ping
			utility.pingServer([config.spigotServerPort, config.spigotServerAddress], (result) => {
				console.log(`Server is online: ${result}`);
				if (result) {
					server.online = true;
				} else {
					server.online = false;
				}

				utility.editMessage(global.lastMessage, server);
			});

			// Ping interval
			global.pingInt = setInterval(() => {
				utility.pingServer([config.spigotServerPort, config.spigotServerAddress], (result) => {
					console.log(`Server is online: ${result}`);
					if (result) {
						server.online = true;
					} else {
						server.online = false;
					}

					utility.editMessage(global.lastMessage, server);
				});
			}, config.verifyInterval*1000);
		});
	}

	// Set status
	client.user.setActivity("DevServer", {type: "WATCHING"});
});

// Event: on webhook message
client.on("message", (message) => {
	if (message.channel.id === config.webhookChannel) {
		let type = "";
		let player = "";

		// Server offline
		if (message.content.includes("SERVER_SHUTDOWN_PROCESS")) {
			type = "offline";
			server.online = false;
			server.lastOnline = Date.now();

			server.players = [];
		}
		// Server online
		if (message.content.includes("SERVER_INIT_SUCCESS")) {
			type = "online";
			server.online = true;
			server.lastOnline = Date.now();
		}
		// Player joins
		if (message.content.includes("joined. online:")) {
			type = "join";
			server.lastOnline = Date.now();
			server.online = true;

			player = utility.parsePlayerName(message.content.split(" joined. online: ")[0]);

			server.players.push(player);
		}
		// Player leaves
		if (message.content.includes("left. online:")) {
			type = "leave";

			player = utility.parsePlayerName(message.content.split(" left. online: ")[0]);

			server.players = server.players.filter((playerOnline) => {
				return playerOnline != player;
			});
		}
		// Server health update
		if (message.content.includes("SERVER_HEALTH_REPORT")) {
			type = "health";
			server.lastOnline = Date.now();
			server.online = true;

			let report = message.content.split("|");
			report.shift();
			report[0] = report[0].split(": ");
			report[0][1] = report[0][1].match(/^-?\d+(?:\.\d{0,1})?/)[0];
			report[0] = report[0].join(": ");
			server.health[0] = report[0];
			server.health[1] = report[1];
		}

		// Sends new message on online/offline event
		if (type === "online" || type === "offline") {
			utility.sendNewMessage(global.lastMessage, global.botChannel, server, () => {
				utility.fetchBotMessage(global.botChannel, (message) => {
					global.lastMessage = message;
				});
			});
			// Edits message on join/leave/health event
		} else {
			utility.editMessage(global.lastMessage, server);
		}
	}
});

/*
*==================================
* WEBSERVER
*==================================
*/

app.get("/", (req, res) => {
   console.log("Request is:");
   console.log(req.body);
});

if (!config.useWebhook) {
   app.listen(config.webserverPort, () => {
      console.log(`Webserver listening on port ${config.webserverPort}`);
   });
}

// Login
client.login(token.token);
