const config = require('../config/config');
const Discord = require('discord.js');

const options = {

    name: 'join',
    aliases: ['enter'],

    usage: '<queue name>',
    description: 'Adds you to the specified queue and sends a message with your info in the queue channel.',

    cooldown: 5,
    minArgs: 1,
};

async function execute(message, args, db) {

    const name = args.join('-').toLowerCase();

    const queueDB = db.collection('queues');
    const userdataDB = db.collection('userdata');

    console.log(`[ INFO ] Adding user to queue "${name}"`);

    // look for queue in db
    const queueArr = await queueDB.find({ name: name }).toArray();

    // if queue not found, abort
    if (queueArr.length == 0) {
        console.log('[ INFO ]  > No queue by that name. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle(`Oops! Could not find queue \`${name}\`. Did you type it right?`);
        return message.channel.send(errEmbed);
    }

    const { capacity, users, taken, channelID } = queueArr[0];

    // if already in the queue
    if (users.includes(message.author.id)) {
        console.log('[ INFO ]  > User already in queue. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle(`Oops! You're already in queue \`${name}\`.`);
        return message.channel.send(errEmbed);
    }

    // if queue is full
    if (taken == capacity) {
        console.log('[ INFO ]  > Queue full. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle(`Oops! Queue \`${name}\` is full`);
        return message.channel.send(errEmbed);
    }

    // look for userdata in db
    const userArr = await userdataDB.find({ userID: message.author.id }).toArray();

    // if userdata not found, abort
    if (userArr.length == 0) {
        console.log('[ INFO ]  > User hasn\'t added info. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! You haven\'t added your info yet.')
            .setDescription(`Use \`${config.prefix}set\` to set that up`);
        return message.channel.send(errEmbed);
    }
    if (!(userArr[0].ign && userArr[0].island)) {
        console.log(`[ INFO ]  > User ${message.author} hasn't added info. Aborting.`);
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! You haven\'t added all of your info yet.')
            .setDescription(`Make sure you \`${config.prefix}set\` your IGN and island name.`);
        return message.channel.send(errEmbed);
    }

    // make channel visible to user + write + see prev messages
    message.guild.channels.get(channelID).overwritePermissions(message.author, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'READ_MESSAGE_HISTORY': true });

    // post info to channel
    const { ign, island } = userArr[0];

    const queueEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setDescription(`\`${taken + 1}/${capacity}\` ${message.author} \n**IGN**: \`${ign}\` \n**Island**: \`${island}\``);
    message.guild.channels.get(channelID).send(queueEmbed);

    // decrease available queue spots
    queueDB.updateOne({ name: name }, { $inc: { taken: 1 }, $push: { users: message.author.id } });

    // confirmation message
    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle('Added you to the queue.')
        .setDescription(`You're in position ${taken + 1} of ${capacity}.`);
    message.channel.send(replyEmbed);
    return;
}

module.exports = options;
module.exports.execute = execute;
