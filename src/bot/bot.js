const Net = require("net");
const { Client, GatewayIntentBits, Events } = require('discord.js');
const Filesystem = require("fs");
const config = JSON.parse(Filesystem.readFileSync("./config.json", "utf-8"));
const token = JSON.parse(Filesystem.readFileSync("./token.json", "utf-8"))
const os = require('os');
const { exec } = require('child_process');


let outputs = { status: null, errors: null };
// state
let server = {
	lastOnline: 0,
	online: false,
	players: [],
	health: [],
	message: [],
	msgChannel: null,
	cmdChannel: null,
	errors: [],
	verifiedAt: new Date().toISOString(),
};
// internal config
const intConfig = {
	onlineColor: 0x00b7ff,
	offlineColor: 0xff0000,
	errorColor: 0x800808,
};

// Create a new client
const BotClient = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});


// Bot ready
BotClient.once(Events.ClientReady, (readyClient) => {
	console.log("Bot active");

	// Get correct channel
	server.msgChannel = BotClient.channels.cache.get(config.botChannel);
	if (config.commandChannel) {
		server.cmdChannel = BotClient.channels.cache.get(config.commandChannel);
	}

	// Hook existing message
	Utility.fetchBotMessage((msg) => {
		if (msg) {
			outputs.status = msg;
			Utility.message();
		}
	});

	// Set status
	BotClient.user.setActivity(config.serverName, {type: "WATCHING"});

	// Verification ping
	if (config.verifyStatus) {
		setInterval(() => {
			const pingAddress = config.serverAddress || Utility.getIPAddress();
			Utility.pingServer([config.serverPort, pingAddress], (result) => {
				server.online = result;
				server.verifiedAt = new Date().toISOString();
				console.log(`Server is online: ${result}`);

				Utility.message();
			});
		}, config.verifyInterval * 1000);
	}
});

// React to input
BotClient.on(Events.MessageCreate, (message) => {
	// Ignore messages sent by the bot itself
	if (message.author.id === BotClient.user.id) return;
	
	if (message.channel.id === config.webhookChannel) {
		handleHealthReport(message);
		Utility.message();
	} else if (message.channel.id === config.commandChannel) {
		handleRconInput(message);
	}
});

function handleHealthReport(message) {
	let command = message.content.split("|");

	server.verifiedAt = new Date().toISOString();

	let player = "";

	console.log("Health update received: " + command.join(" | "));

	// Actions for different commands
	switch (command[0]) {
		case "SERVER_INIT":
			server.lastOnline = new Date().toISOString();
			server.online = true;
			server.players = [];
			break;
		case "SERVER_SHUTDOWN":
			server.lastOnline = new Date().toISOString();
			server.online = false;
			server.players = [];
			break;
		case "PLAYER_JOIN":
			server.lastOnline = new Date().toISOString();
			server.online = true;
			player = Utility.parsePlayerName(command[1]);
			server.players.push(player);
			server.players = [...new Set(server.players)];
			break;
		case "PLAYER_LEAVE":
			server.lastOnline = new Date().toISOString();
			server.online = true;
			player = Utility.parsePlayerName(command[1]);
			server.players = server.players.filter((playerOnline) => {
				return playerOnline != player;
			});
			break;
		case "SERVER_REPORT":
			server.lastOnline = new Date().toISOString();
			server.online = true;
			server.health[0] = command[1];
			server.health[1] = command[2];
			break;
		case "SET_MESSAGE":
			server.message[parseInt(command[1])] = command[2];
			break;
		case "CLEAR_ERRORS":
			server.errors = [];
			Utility.deleteErrorMsg();
			break;
		default:
			console.log("Invalid operator: " + command[0]);
	}
}

function handleRconInput(message) {
    const serverAddress = config.serverAddress || Utility.getIPAddress();
	exec(`mcrcon -H ${serverAddress} -P ${config.rconPort} -p ${config.rconPassword} "${message.content}"`, (error, stdout, stderr) => {
		let embedData = {
			color: (error || stderr) ? intConfig.errorColor : intConfig.onlineColor,
			title: (error || stderr) ? "Error" : "Success",
			fields: null,
			timestamp: new Date().toISOString(),
		}

		if (error) {
			console.log("Error executing command");
			embedData.fields = [
				{
					name: "error",
					value: JSON.stringify(error).substring(0, 1000), // Discord's API has a limit of 1024 characters
				}
			];
		} else if (stderr) {
			console.log("Command failed");
			embedData.fields = [
				{
					name: "stderr",
					value: JSON.stringify(stderr).substring(0, 1000),
				}
			];
		} else if (stdout) {
			console.log("Command successful");
			embedData.fields = [
				{
					name: "stdout",
					value: JSON.stringify(stdout).substring(0, 1000),
				}
			];
		} else {
			console.log("Command success indeterminate");
			embedData.fields = [
				{
					name: "No output",
					value: "No output to display",
				}
			];
		}

		server.cmdChannel
			.send({ embeds: [embedData] })
			.catch((error) => {
				console.log("Command channel message send failed");
				console.log(error);
				Utility.error(error);
			});
	});
}



// Common functions
class Utility {
	// Send/ edit a status message
	static message() {
		// Server data
		let lines = [
			{
				name: "Connection Status: \u200b\u200b\u200b",
				value: server.online ? ":white_check_mark: Online" : ":x: Offline",
				inline: true,
			},
		];

		// Online data
		if (server.online) {
			lines.push({
				name: "Current TPS:",
				value: ":signal_strength: " + (server.health[0] || "Waiting..."),
			});
			lines.push({
				name: "Current memory usage:",
				value: ":chart_with_downwards_trend: " + (server.health[1] || "Waiting..."),
			});
			lines.push({
				name: "Players online:",
				value: server.players.length > 0 ? server.players.join("\n") : "\u200b",
			});
			lines.push({
			    name: "IP address:",
			    value: Utility.getIPAddress() + ":" + config.serverPort,
			});
		} else {
			lines.push({
				name: "Last online:",
				value: Utility.getTimeSince(new Date(server.lastOnline).valueOf()),
			});
			lines.push({
			    name: "IP address:",
			    value: Utility.getIPAddress() + ":" + config.serverPort,
			});
		}

		// Embed data
		let embedData = {
			color: server.online ? intConfig.onlineColor : intConfig.offlineColor,
			title: "Server Status",
			fields: lines,
			timestamp: server.verifiedAt,
			footer: {
				text: "Verified: ",
			},
		};

		// Custom message
		if (server.message.length > 0) {
			embedData.description = server.message.join("\n");
		}

		// Create embed

		// Send a new message or edit the existing one
		if (outputs.status) {
			// edit existing embed
			outputs.status.edit({ embeds: [embedData] }).catch((error) => {
				console.log("Message edit failed");
				console.log(error);
				Utility.error(error);
			});
		} else {
			// create new embed
			server.msgChannel
				.send({ embeds: [embedData] })
				.then((message) => {
					outputs.status = message;
				})
				.catch((error) => {
					console.log("Message send failed");
					console.log(error);
					Utility.error(error);
				});
		}
	}


	static commandOutput(message) {

	}
	// Send an error message
	static error(e) {
		let str = `HTTP Status: ${e.httpStatus} Code: ${e.code} Path: ${e.path}`;
		if (!server.errors.includes(str)) {
			server.errors.push(str);
		}
		let embedData = {
			color: intConfig.errorColor,
			title: "ERRORS",
			fields: [
				{
					name: "Current:",
					value: server.errors.join("\n\n"),
				},
			],
		};
		
		if (outputs.errors) {
			outputs.errors.edit({ embeds: [embedData] }).catch((error) => {
				console.log("Error message edit failed");
				console.log(error);
				Utility.error(error);
			});
		} else {
			server.msgChannel
				.send({ embeds: [embedData] })
				.then((message) => {
					outputs.errors = message;
				})
				.catch((error) => {
					console.log("Error message send failed");
					console.log(error);
					Utility.error(error);
				});
		}
	}

	static deleteErrorMsg() {
		if (!outputs.errors) return;

		outputs.errors
			.delete()
			.then(() => {
				console.log("Error message delete successful");
				outputs.errors = null;
			})
			.catch(() => {
				console.log("Could not delete error message");
			});
	}

	// Returns a string that says how long it has been since the given timestamp
	static getTimeSince(date) {
		if (date == 0) {
			return "Unknown";
		}

		var seconds = Math.floor((Date.now() - date) / 1000);
		var interval = seconds / 31536000;
		if (interval > 1) {
			if (Math.floor(interval) > 5) {
				return "a very long time ago";
			}
			return Math.floor(interval) + (Math.floor(interval) == 1 ? " year ago" : " years ago");
		}
		interval = seconds / 2592000;
		if (interval > 1) {
			return Math.floor(interval) + (Math.floor(interval) == 1 ? " month ago" : " months ago");
		}
		interval = seconds / 86400;
		if (interval > 1) {
			return Math.floor(interval) + (Math.floor(interval) == 1 ? " day ago" : " days ago");
		}
		interval = seconds / 3600;
		if (interval > 1) {
			return Math.floor(interval) + (Math.floor(interval) == 1 ? " hour ago" : " hours ago");
		}
		interval = seconds / 60;
		if (interval > 1) {
			return Math.floor(interval) + (Math.floor(interval) == 1 ? " minute ago" : " minutes ago");
		}
		return "Just now";
	}

	// Returns a time + date string from a timestamp (hh:mm:ss xm, mm/dd/yyyy)
	static getTime(date) {
		if (date == 0) {
			return "";
		}
		return new Date(date).toLocaleTimeString("en-US") + ", " + new Date(date).toLocaleDateString("en-US");
	}

	// Get the last bot message
	static fetchBotMessage(callback) {
		server.msgChannel.messages.fetch({limit: 1}).then((messages) => {
			messages.forEach((message) => {
				callback(message);
			});
		});
	}

	// Ping the server socket to verify it is active
	static pingServer(ip, callback) {
		let socket = new Net.Socket();
		socket.setTimeout(config.verificationTimeout * 1000);
		socket
			.on("connect", () => {
				callback(true);
				socket.destroy();
			})
			.on("error", () => {
				callback(false);
			})
			.on("timeout", () => {
				callback(false);
			})
			.connect(ip[0], ip[1]);
	}

	// Parse a player's name to prevent text formatting
	static parsePlayerName(name) {
		let fixedName = name.trim();
		fixedName = fixedName.split("").map((char) => {
			if (char === "*" || char === "_") {
				return "\\" + char;
			}
			return char;
		});
		fixedName = fixedName.join("");
		return fixedName;
	}

	// Get the IP address of the machine running the bot
	static getIPAddress() {
		const networkInterfaces = os.networkInterfaces();
		for (const interfaceName in networkInterfaces) {
			for (const interfaceInfo of networkInterfaces[interfaceName]) {
				if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
					return interfaceInfo.address;
				}
			}
		}
		return "IP address not found";
	}
}

BotClient.login(token.botToken);