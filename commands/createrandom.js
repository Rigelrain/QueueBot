const config = require('../config/config');
const Discord = require('discord.js');

let queueChannel, listMsg;

const options = {

    name: 'random',

    usage: '<queue name> <capacity>',
    description: 'Creates a new RANDOM queue with the given <queue name> and <capacity>.',

    cooldown: 5,
    minArgs: 2,

    roleRestrict: 'middleman',
};

async function execute(message, args, db) {

    const capacity = parseInt(args.pop());
    const name = args.join('-').toLowerCase();

    if (isNaN(capacity) || capacity <= 0) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Queue capacity needs to be a positive number.')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    // limit name length to 20 characters
    if (name.length > 20) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Name is too long. Max 25 chars')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    console.log(`[ INFO ] Creating queue with name "${name}" and capacity ${capacity}`);

    const queueDB = db.collection('queues');

    // look for name in db to see if already used
    const findarr = await queueDB.find({ name: name }).toArray();

    // if name already in use, abort
    if (findarr.length != 0) {
        console.log('[ INFO ]  > Duplicate name. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! A queue with that name already exists. Please choose a different name.')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
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
    const listEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`**${name}**`)
        .setDescription(`**Host**: ${message.author}`)
        .addField(`0/${capacity} spots taken, React with ${config.reactEmoji} to join the queue.`);

    listMsg = await message.guild.channels.get(config.queueListChannelID).send(listEmbed);
    listMsg.react(message.guild.emojis.get(config.reactEmoji.slice(-19, -1))); // extract emoji id from full string

    // create channel w/ perms (only allow needed people access to channel)
    const permissions = [
        { id: message.client.user, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }, // the bot can send
        { id: message.author, allow: ['VIEW_CHANNEL'] }, // queue host can see
        { id: message.guild.id, deny: ['VIEW_CHANNEL'] }, // @everyone cannot
        { id: config.roles.admin, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }, // admin role can send
    ];

    // send header message to queue channel
    queueChannel = await message.guild.createChannel(name, {
        type: 'text',
        parent: config.queueCategoryID,
        permissionOverwrites: permissions,
    });
    const queueEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`**Random queue \`${name}\`**`)
        .addField(`Capacity:  \` ${capacity} \``, `Host: ${message.author}`);
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

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle(`Queue \`${name}\` created.`)
        .setDescription(`Channel: ${queueChannel}`);
    message.channel.send(replyEmbed);

    return;

}

// Reaction event handlers from main file
async function reactAdd(reaction, user, client, db) {

    // ignore reacts on messages not in #queue-list
    if (reaction.message.channel.id != config.queueListChannelID) return;

    // look for queue in db
    const queueDB = db.collection('queues');
    const queueArr = await queueDB.find({ listMsgID: reaction.message.id }).toArray();

    // if queue not found, abort (reaction was not on a valid queuelist message)
    if (queueArr.length == 0) return;

    const queue = queueArr[0];
    // remove new reactions if queue is full and dm user that that queue is full
    if (queue.taken >= queue.capacity) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle(`Oops! Queue \`${queue.name}\` is full!.`);
        user.send(errEmbed);
        reaction.remove(user);
        return;
    }

    // look for userdata in db
    const userdataDB = db.collection('userdata');
    const userArr = await userdataDB.find({ userID: user.id }).toArray();

    // if userdata not found, abort
    if (userArr.length == 0) {
        console.log('[ INFO ]  > User hasn\'t added info. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! You haven\'t added your info yet.')
            .setDescription(`Use \`${config.prefix}set\` to set that up`);
        return user.send(errEmbed);
    }
    if (!(userArr[0].ign && userArr[0].island)) {
        console.log('[ INFO ]  > User hasn\'t added info. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! You haven\'t added all of your info yet.')
            .setDescription(`Make sure you \`${config.prefix}set\` your IGN and island name.`);
        return user.send(errEmbed);
    }

    console.log(`[ INFO ] Adding user to random queue pool "${queue.name}"`);

    // decrease available queue spots
    queueDB.updateOne({ listMsgID: reaction.message.id }, { $inc: { taken: 1 }, $push: { users: user.id } });
    queue.taken++;

    // make channel visible to user
    reaction.message.guild.channels.get(queue.channelID).overwritePermissions(user, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true });

    // post info to channel
    const info = userArr[0];

    const queueEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setDescription(`\`${queue.taken}/${queue.capacity}\` ${user} \n**Switch profile**: \`${info.profile}\` \n**IGN**: \`${info.ign}\` \n**Friendcode**: \`${info.fc}\``);
    reaction.message.guild.channels.get(queue.channelID).send(queueEmbed);


    // confirmation message
    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle(`Added you to queue \`${queue.name}\` in server ${reaction.message.guild.name}.`)
        .setDescription(`You're in position ${queue.taken} of ${queue.capacity}.`);
    user.send(replyEmbed);

    // edit list message to show new capacity / if its full
    let capacityStr = `React with ${config.reactEmoji} to join the queue.`;
	
    // if queue is now full, clear reactions
    if (queue.taken >= queue.capacity) {
        capacityStr = 'Queue is full!';
        reaction.message.clearReactions();
    }

    const newListEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`**${queue.name}**`)
        .setDescription(`**Host**: ${queue.host}`)
        .addField(`\`${queue.taken}\` / \`${queue.capacity}\` spots taken`, capacityStr);
    reaction.message.edit(newListEmbed);

}


async function reactRemove(reaction, user, client, db) {

    // ignore reacts on messages not in #queue-list
    if (reaction.message.channel.id != config.queueListChannelID) return;

    // look for queue in db
    const queueDB = db.collection('queues');
    const queueArr = await queueDB.find({ listMsgID: reaction.message.id }).toArray();

    // if queue not found, abort (reaction was not on a valid queuelist message)
    if (queueArr.length == 0) return;

    const queue = queueArr[0];

    // ignore reacts if queue is full, but only if the user isnt in the queue
    if (queue.taken >= queue.capacity && !queue.users.includes(user.id)) return;

    console.log(`[ INFO ] Removing user from random queue pool "${queue.name}"`);

    // increase available queue spots
    queueDB.updateOne({ listMsgID: reaction.message.id }, { $inc: { taken: -1 }, $pull: { users: user.id } });
    queue.taken--;

    // confirmation message
    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.error)
        .setTitle(`Removed you from queue \`${queue.name}\` in server ${reaction.message.guild.name}.`);
    user.send(replyEmbed);

    // edit list message to show new capacity / if its full
    const capacityStr = (queue.taken == queue.capacity) ? 'Queue is full!' : `React with ${config.reactEmoji} to join the queue.`;

    const newListEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`**${queue.name}**`)
        .setDescription(`**Host**: ${queue.host}`)
        .addField(`\`${queue.taken}\` / \`${queue.capacity}\` spots taken`, capacityStr);
    reaction.message.edit(newListEmbed);

}

module.exports = options;
module.exports.execute = execute;
module.exports.reactAdd = reactAdd;
module.exports.reactRemove = reactRemove;
