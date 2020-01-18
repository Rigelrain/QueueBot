const { prefix, queueCategoryID, queueListChannelID, queueAdminRoleIDs, colors } = require('../config.json');
const Discord = require('discord.js');

let queueChannel, listMsg;

const options = {

	name: 'random',

	usage: '<queue name> <capacity>',
	description: 'Creates a new RANDOM queue with the given <queue name> and <capacity>.',

	cooldown: 5,
	minArgs: 2,

	mmOnly: true,
};

async function execute(message, args, db) {

	const capacity = parseInt(args.pop());
	const name = args.join('-').toLowerCase();

	if (isNaN(capacity) || capacity <= 0) {
		const errEmbed = new Discord.RichEmbed().setColor(colors.error)
			.setTitle("Oops! Queue capacity needs to be a positive number.")
			.addField("Usage:", `\`${prefix}${options.name} ${options.usage}\``);
		return message.channel.send(errEmbed);
	}

	// limit name length to 20 characters
	if (name.length > 20) {
		const errEmbed = new Discord.RichEmbed().setColor(colors.error)
			.setTitle("Oops! Name is too long. Max 25 chars")
			.addField("Usage:", `\`${prefix}${options.name} ${options.usage}\``);
		return message.channel.send(errEmbed);
	}

	console.log(`[ INFO ] Creating queue with name "${name}" and capacity ${capacity}`);

	const queueDB = db.collection('queues');

	// look for name in db to see if already used
	const findarr = await queueDB.find({ name: name }).toArray();

	// if name already in use, abort
	if (findarr.length != 0) {
		console.log("[ INFO ]  > Duplicate name. Aborting.");
		const errEmbed = new Discord.RichEmbed().setColor(colors.error)
			.setTitle("Oops! A queue with that name already exists. Please choose a different name.")
			.addField("Usage:", `\`${prefix}${options.name} ${options.usage}\``);
		return message.channel.send(errEmbed);
	}

	/* send message to #queue-list
 * create private channel
 * users react to join
 * host -> !next #
 * dms # of reacted users randomly
 * dm'd users respond to gen inv. to channel
 * channel generates pin for raid
 * users booted once done
 */

	// send message to #queue-list && add reactions
	const listEmbed = new Discord.RichEmbed().setColor(colors.info)
		.setTitle(`**${name}**`)
		.setDescription("**Host**: " + message.author)
		.addField("Capacity: " + capacity, "React with <:pokeball:667267492598513684> to join the queue.");

	listMsg = await message.guild.channels.get(queueListChannelID).send(listEmbed);
	listMsg.react(message.guild.emojis.get('667267492598513684'));

	// create queue channel w/ perms (only allow needed people access to channel)
	const permissions = [
		{ id: message.client.user, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }, // the bot
		{ id: message.author, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }, // queue host
		{ id: message.guild.id, deny: ['VIEW_CHANNEL'] }, // @everyone
	];
	queueAdminRoleIDs.forEach(role => {		// queue admin roles
		permissions.push({ id: role, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] });
	});

	// send header message to queue channel
	const queueEmbed = new Discord.RichEmbed().setColor(colors.info)
		.setTitle(`**Random queue \`${name}\`**`)
		.addField(`Capacity:  \` ${capacity} \``, `Host: ${message.author}`);
	queueChannel = await message.guild.createChannel(name, { type: 'text', parent: queueCategoryID,
		permissionOverwrites: permissions });
	queueChannel.send(queueEmbed);

	// add new queue to db
	queueDB.insertOne({
		listMsgID: listMsg.id,
		channelID: queueChannel.id,
		name: name,
		host: message.author.id,
		capacity: capacity,
		taken: 0,
		users: [],
		random: true,
	});

	const replyEmbed = new Discord.RichEmbed().setColor(colors.success)
		.setTitle(`Queue \`${name}\` created.`)
		.setDescription(`Channel: ${queueChannel}`);
	message.channel.send(replyEmbed);

	console.log("[ INFO ]  > Queue and channel created. ");

	return;

}

// Reaction event handlers from main file
async function reactAdd(reaction, user, client, db) {

	// ignore reacts on messages not in #queue-list
	if (reaction.message.channel.id != queueListChannelID) return;

	// look for queue in db
	const queueDB = db.collection('queues');
	const queueArr = await queueDB.find({ listMsgID: reaction.message.id }).toArray();

	// if queue not found, abort (reaction was not on a valid queuelist message)
	if (queueArr.length == 0) return;

	const queue = queueArr[0];
	
	console.log(`[ INFO ] Adding user to random queue pool "${queue.name}"`);

	// decrease available queue spots
	queueDB.updateOne({ listMsgID: reaction.message.id }, { $inc: { taken: 1 }, $push: { users: user.id } });

	// confirmation message
	const replyEmbed = new Discord.RichEmbed().setColor(colors.success)
		.setTitle(`Added you to queue \`${queue.name}\` in server ${reaction.message.guild.name}.`)
		.setDescription(`You're in position ${queue.taken + 1} of ${queue.capacity}.`);
	user.send(replyEmbed);

}
async function reactRemove(reaction, user, client, db) {
	
	// ignore reacts on messages not in #queue-list
	if (reaction.message.channel.id != queueListChannelID) return;

	// look for queue in db
	const queueDB = db.collection('queues');
	const queueArr = await queueDB.find({ listMsgID: reaction.message.id }).toArray();

	// if queue not found, abort (reaction was not on a valid queuelist message)
	if (queueArr.length == 0) return;

	const queue = queueArr[0];
	
	console.log(`[ INFO ] Removing user from random queue pool "${queue.name}"`);
	
	// increase available queue spots
	queueDB.updateOne({ listMsgID: reaction.message.id }, { $inc: { taken: -1 }, $pull: { users: user.id } });
	
	// confirmation message
	const replyEmbed = new Discord.RichEmbed().setColor(colors.error)
		.setTitle(`Removed you from queue \`${queue.name}\` in server ${reaction.message.guild.name}.`)
	user.send(replyEmbed);
}

module.exports = options;
module.exports.execute = execute;
module.exports.reactAdd = reactAdd;
module.exports.reactRemove = reactRemove;
