const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.commands = new Discord.Collection();
const antispam = require('better-discord-antispam');
const Canvas = require('canvas');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
let db = JSON.parse(fs.readFileSync("./database.json", "utf8"));
for (const file of commandFiles) {
	const command = require(`./commands/s {file}`);
	client.commands.set(command.name, command);
}
client.once('ready', () => {
	antispam(client, {
        limitUntilWarn: 10, // The amount of messages allowed to send within the interval(time) before getting a warn.
        limitUntilMuted: 15, // The amount of messages allowed to send within the interval(time) before getting a muted.
        interval: 6000, // The interval(time) where the messages are sent. Practically if member X sent 5+ messages within 2 seconds, he get muted. (1000 milliseconds = 1 second, 2000 milliseconds = 2 seconds etc etc)
        warningMessage: "if you don't stop from spamming, I'm going to mute you!", // Message you get when you are warned!
        muteMessage: "Was muted for spam.", // Message sent after member X was punished(muted).
        maxDuplicatesWarning: 6,// When people are spamming the same message, this will trigger when member X sent over 7+ messages.
        maxDuplicatesMute: 10, // The limit where member X get muted after sending too many messages(10+).
        ignoredRoles: ["♡Admin♡"], // The members with this role(or roles) will be ignored if they have it. Suggest to not add this to any random guys. Also it's case sensitive.
        mutedRole: "Muted", // Here you put the name of the role that should not let people write/speak or anything else in your server. If there is no role set, by default, the module will attempt to create the role for you & set it correctly for every channel in your server. It will be named "muted".
        timeMuted: 1000 * 600, // This is how much time member X will be muted. if not set, default would be 10 min.
	logChannel: "logs"
      });
	console.log(`${client.user.tag} Is now online.`); //says this when it goes back up

	client.user.setActivity(`My revival. | ${prefix}help`, { type: 'LISTENING' })
		.then(presence => console.log(`Activity set to '${presence.activities[0].name}'`))
});
client.on('message', async message => {
	client.emit('checkMessage', message);
	if (!db[message.author.id]) db[message.author.id] = {
		xp: 0,
		level: 0
	};
	db[message.author.id].xp++;
	let userInfo = db[message.author.id];
	if (userInfo.xp > 100) {
		userInfo.level++
		userInfo.xp = 0
		message.reply(`Congratulations, you leveled up to level ${userInfo.level}`)
	}
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	if (message.content.startsWith(`s {prefix}rank`)) {
		let userInfo = db[message.author.id];
		let member = message.mentions.members.first();
		let embed = new Discord.MessageEmbed()
			.setColor(0x4286f4)
			.addField("Level", userInfo.level)
			.addField("XP", userInfo.xp + "/100");
		if (!member) return message.channel.send(embed)
		let memberInfo = db[member.id]
		let embed2 = new Discord.MessageEmbed()
			.setColor(0x4286f4)
			.addField("Level", memberInfo.level)
			.addField("XP", memberInfo.xp + "/100")
		message.channel.send(embed2)
		fs.writeFile("./database.json", JSON.stringify(db), (x) => {
			if (x) console.error(x)
		});
	}

	const args = message.content.slice(prefix.length).trim().split(' ');
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command! Maybe try pinging someone if the command needs a pinged user!');
	}
});
client.on('messageDelete', message => {
	const channel = message.guild.channels.cache.find(ch => ch.name === 'logs');
	let deleteEmbed = new Discord.MessageEmbed()
		.setColor(0x8B0000)
		.setAuthor(`${message.author.tag}`, message.author.avatarURL())
		.setDescription(`A message was deleted in <#${message.channel.id}>`)
		.addField('Content', message.content)
		.setFooter(`User ID: ${message.author.id}`)
		.setTimestamp()
	channel.send(deleteEmbed);
});
client.on('messageUpdate', (oldMessage, newMessage) => {
	const channel = oldMessage.guild.channels.cache.find(ch => ch.name === 'logs');
	if(oldMessage.content === newMessage.content) return;
	let UpdatedEmbed = new Discord.MessageEmbed()
		.setColor(0xFFFF00)
		.setAuthor(`${newMessage.author.tag}`, newMessage.author.avatarURL())
		.setDescription(`A message was updated in <#${oldMessage.channel.id}>`)
		.addField(`Old Message`, oldMessage.content)
		.addField(`New Message`, newMessage.content)
		.setFooter(`User ID: ${oldMessage.author.id}`)
		.setTimestamp()
	channel.send(UpdatedEmbed);
});
const applyText = (canvas, text) => {
	const ctx = canvas.getContext('2d');

	// Declare a base size of the font
	let fontSize = 70;

	do {
		// Assign the font to the context and decrement it so it can be measured again
		ctx.font = `${fontSize -= 10}px sans-serif`;
		// Compare pixel width of the text to the canvas minus the approximate avatar size
	} while (ctx.measureText(text).width > canvas.width - 300);

	// Return the result to use in the actual canvas
	return ctx.font;
};
client.on('guildMemberAdd', async member => {
	const channel = member.guild.channels.cache.find(ch => ch.name === '👋𑁍welcome𑁍');
	if (!channel) return;

	const canvas = Canvas.createCanvas(700, 250);
	const ctx = canvas.getContext('2d');

	const background = await Canvas.loadImage('./wallpaper.jpg');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

	ctx.strokeStyle = '#74037b';
	ctx.strokeRect(0, 0, canvas.width, canvas.height);

	// Slightly smaller text placed above the member's display name
	ctx.font = '28px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.fillText('Welcome to the server,', canvas.width / 2.5, canvas.height / 3.5);

	// Add an exclamation point here and below
	ctx.font = applyText(canvas, `${member.displayName}!`);
	ctx.fillStyle = '#ffffff';
	ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height / 1.8);

	ctx.beginPath();
	ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
	ctx.drawImage(avatar, 25, 25, 200, 200);

	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');

	channel.send(`Welcome to the server, ${member}!`, attachment);
});
client.on('guildMemberRemove', async member => {
	const channel = member.guild.channels.cache.find(ch => ch.name === '👋𑁍welcome𑁍');
	if (!channel) return;

	const canvas = Canvas.createCanvas(700, 250);
	const ctx = canvas.getContext('2d');

	const background = await Canvas.loadImage('./wallpaper.jpg');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

	ctx.strokeStyle = '#74037b';
	ctx.strokeRect(0, 0, canvas.width, canvas.height);

	// Slightly smaller text placed above the member's display name
	ctx.font = '28px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.fillText('Goodbye,', canvas.width / 2.5, canvas.height / 3.5);

	// Add an exclamation point here and below
	ctx.font = applyText(canvas, `${member.displayName}!`);
	ctx.fillStyle = '#ffffff';
	ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height / 1.8);

	ctx.beginPath();
	ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
	ctx.drawImage(avatar, 25, 25, 200, 200);

	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'goodbye-image.png');

	channel.send(`Cya soon, **${member.tag}**!`, attachment).then(sentMessage => {
	sentMessage.react('748627665233248347');
	});
});
client.login(process.env.TOKEN)
