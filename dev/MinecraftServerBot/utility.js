const Net = require("net");
const Discord = require("discord.js");
const fs = require("fs");

let config = {
   verifyTimeout: 3000,
}

config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

// Returns a string that says how long it has been since the given timestamp
function getTimeSince(date) {
   if (date == 0) {
      return "unknown";
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
function getTime(date) {
   if (date == 0) {
      return "";
   }
	return new Date(date).toLocaleTimeString("en-US") + ", " + new Date(date).toLocaleDateString("en-US");
}

// Ping the server socket to verify it is active
function pingServer(ip, callback) {
	let socket = new Net.Socket();
	socket.setTimeout(config.verifyTimeout);
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
function parsePlayerName(name) {
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

// Get the last bot message
function fetchBotMessage(channel, callback) {
	channel.messages.fetch({limit: 1}).then((messages) => {
		messages.forEach((message) => {
			callback(message);
		});
	});
}

// Edit the last embed message (join/leave/health events)
function editMessage(message, server, callback) {
	// Message
   let embedMsg = `${server.online ? ":white_check_mark: Online" : ":x: Offline"} (Verified at ${getTime(Date.now())})
   \n`;

   if (!server.online) {
      embedMsg +=
      `:clock2: Last online: ${getTime(server.lastOnline)} (${getTimeSince(server.lastOnline)})
      \n`;
   }
      
   if (server.online && server.health.length > 0) {
      embedMsg +=
      `:signal_strength: ${server.health[0]}
      \n:bar_chart: ${server.health[1]}
      \n`;
   }

   if (server.online) {
      embedMsg += 
      `:video_game: Players online (${ server.players.length }): \n`;
   }

	server.players.forEach((op) => {
		embedMsg += `- ${op} \n`;
	});

	// Construct embed
	const embed = new Discord.MessageEmbed()
		.setTitle("Server Status")
		.setColor(server.online ? server.onlineColor : server.offlineColor)
		.setDescription(embedMsg);

	// Send
   message.edit(embed).then(() => {
      if (callback) {
         callback();
      }
   }).catch((error) => {
		console.log("Message edit failed");
		console.log(error);
		process.exit();
	});
}

// Send a new embed message (online/offline events)
function sendNewMessage(message, channel, server, callback) {
	// Message
	let embedMsg = `${server.online ? ":white_check_mark: Online" : ":x: Offline"} (Verified at ${getTime(Date.now())})
   \n`;
   
   if (!server.online) {
      embedMsg += `:clock2: Last online: ${getTime(server.lastOnline)} (${getTimeSince(server.lastOnline)})
      \n`;
   }

   if (server.online) {
      embedMsg += `:video_game: Players online (${server.players.length}):\n`;
   } 
   
	server.players.forEach((op) => {
		embedMsg += `- ${op} \n`;
	});

	// Construct embed
	const embed = new Discord.MessageEmbed()
		.setTitle("Server Status")
		.setColor(server.online ? server.onlineColor : server.offlineColor)
      .setDescription(embedMsg);
   
	// Delete last message
	message.delete().catch(() => {
		console.log("Delete failed");
	});

	// Send new message
	channel
		.send(embed)
		.then(() => {
         callback();
		})
		.catch((error) => {
			console.log("Message send failed");
			console.log(error);
			process.exit();
		});
}

module.exports = {getTimeSince, getTime, pingServer, parsePlayerName, fetchBotMessage, editMessage, sendNewMessage};