const Net = require("net");
const Discord = require("discord.js");
const Client = new Discord.Client();
const Filesystem = require("fs");
const config = JSON.parse(Filesystem.readFileSync("./config.json", "utf-8"));

let outputs = {status: null, errors: null};
let server = {
	lastOnline: 0,
	online: false,
	players: [],
	health: [],
	message: [],
   msgChannel: null,
   errors: [],
   verifiedAt: Date.now(),
};
const intConfig = {
   onlineColor: "0x00b7ff",
   offlineColor: "0xff0000",
   errorColor: "0x800808",
};

Client.once("ready", () => {
   console.log("Bot active");

	// Get correct channel
	server.msgChannel = Client.channels.cache.get(config.botChannel);

   // Hook existing message
   Util.fetchBotMessage((msg) => {
      if (msg) {
         outputs.status = msg;
         Util.message();
      }
   });

	// Set status
   Client.user.setActivity(config.serverName, { type: "WATCHING" });
   
   // Verification ping
   if (config.verifyStatus) {
      setInterval(() => {
         Util.pingServer([config.serverPort, config.serverAddress], (result) => {
            server.online = result;
            server.verifiedAt = Date.now();
            console.log(`Server is online: ${result}`);
   
            Util.message();
         });
      }, config.verifyInterval * 1000);
   }
});

// React to input
Client.on("message", (message) => {
	if (message.channel.id != config.webhookChannel) return;

   let command = message.content.split("|");
   
   server.verifiedAt = Date.now();

   let player = "";

   console.log("Health update recieved: " + command.join(" | "));

   // Actions for different commands
   switch (command[0]) {
      case "SERVER_INIT":
         server.lastOnline = Date.now();
         server.online = true;
         server.players = [];
			break;
      case "SERVER_SHUTDOWN":
         server.lastOnline = Date.now();
         server.online = false;
         server.players = [];
			break;
      case "PLAYER_JOIN":
         server.lastOnline = Date.now();
         server.online = true;
         player = Util.parsePlayerName(command[1]);
         server.players.push(player);
			break;
      case "PLAYER_LEAVE":
         server.lastOnline = Date.now();
         server.online = true;
         player = Util.parsePlayerName(command[1]);
         server.players = server.players.filter((playerOnline) => {
            return playerOnline != player;
         });
			break;
      case "SERVER_REPORT":
         server.lastOnline = Date.now();
         server.online = true;
         server.health[0] = command[1];
         server.health[1] = command[2];
         break;
      case "SET_MESSAGE":
         server.message[parseInt(command[1])] = command[2];
         break;
      case "CLEAR_ERRORS":
         server.errors = [];
         Util.deleteErrorMsg();
         break;
      default:
         console.log("Invalid operator: " + command[0]);
   }

   Util.message();
});



// Common functions
class Utility {
   constructor() { }
   
   // Send/ edit a status message
   message() {
      // Server data
      let lines = [
         {
            name: "Connection Status: \u200b\u200b\u200b",
            value: server.online ? ":white_check_mark: Online" : ":x: Offline",
            inline: true,
         }
      ];

      // Online data
      if (server.online) {
         lines.push({
            name: "Current TPS:",
            value: ":signal_strength: " + (server.health[0] || "Waiting...")
         });
         lines.push({
            name: "Current memory usage:",
            value: ":chart_with_downwards_trend: " + (server.health[1] || "Waiting...")
         });
         lines.push({
            name: "Players online:",
            value: server.players.length > 0 ? server.players.join("\n") : "\u200b"
         });
      } else {
         lines.push({
            name: "Last online:",
            value: Util.getTimeSince(server.lastOnline)
         });
      }

      // Embed data
      let embedData = {
         color: server.online ? intConfig.onlineColor : intConfig.offlineColor,
         title: "Server Status",
         thumbnail: {
            url: config.thumbnail
         },
         fields: lines,
         timestamp: server.verifiedAt,
         footer: {
            text: "Verified: "
         }
      }

      // Custom message
      if (server.message.length > 0) {
         embedData.description = server.message.join("\n");
      }

      // Create embed
      let embed = new Discord.MessageEmbed(embedData);

      // Send a new message or edit the existing one
      if (outputs.status) {
         outputs.status.edit(embed).catch((error) => {
            console.log("Message edit failed");
            console.log(error);
            Util.error(error);
         });
      } else {
         server.msgChannel.send(embed).then((message) => {
            outputs.status = message;
         }).catch((error) => {
            console.log("Message send failed");
            console.log(error);
            Util.error(error);
         });
      }      
   }

   // Send an error message
   error(e) {
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
               value: server.errors.join("\n\n")
            }
         ]
      }
      let embed = new Discord.MessageEmbed(embedData);
      if (outputs.errors) {
         outputs.errors.edit(embed).catch((error) => {
            console.log("Message edit failed");
            console.log(error);
            Util.error(error);
         });
      } else {
         server.msgChannel.send(embed).then((message) => {
            outputs.errors = message;
         }).catch((error) => {
            console.log("Message send failed");
            console.log(error);
            Util.error(error);
         });
      }      
   }

   deleteErrorMsg() {
      if (!outputs.errors) return;

      outputs.errors.delete().then(() => {
         console.log("Error message delete successful");
         outputs.errors = null;
      }).catch(() => {
         console.log("Could not delete error message");
      });
   }

	// Returns a string that says how long it has been since the given timestamp
	getTimeSince(date) {
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
	getTime(date) {
		if (date == 0) {
			return "";
		}
		return new Date(date).toLocaleTimeString("en-US") + ", " + new Date(date).toLocaleDateString("en-US");
   }
   
   // Get the last bot message
   fetchBotMessage(callback) {
      server.msgChannel.messages.fetch({limit: 1}).then((messages) => {
         messages.forEach((message) => {
            callback(message);
         });
      });
   }

	// Ping the server socket to verify it is active
	pingServer(ip, callback) {
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
	parsePlayerName(name) {
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
}

const Util = new Utility();

Client.login(config.botToken);