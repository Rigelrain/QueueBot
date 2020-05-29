const config = require('../config/config');
const Discord = require('discord.js');
const helper = require('../js/helpers');

/**
 * This command is for members in the queue to leave the queue,
 * signalling that they have done what they queue'd for
 */

const options = {

    name: 'leave',

    aliases: ['exit', 'done'],

    usage: '[queue name]',
    description: 'Removes you from the queue.',

    cooldown: 3,
};

// eslint-disable-next-line no-unused-vars
async function execute(message, args, db) {
    let queueName = args.join('-').toLowerCase();
    if(!queueName || queueName.length === 0) {
        // maybe command was given in a queue channel
        queueName = message.channel.name;
    }

    const queueDB = db.collection('queues');

    // look for queue in db
    const queueArr = await queueDB.find({ name: queueName }).toArray();

    // if queue not found, abort
    if (queueArr.length == 0) {
        return helper.replyCustomError(message, `Oops! Could not find queue \`${queueName}\``, 'You should either write this in the queue channel or check the spelling.', `> No queue ${queueName} found. Aborting.`);
    }

    const { users, channelID, taken, capacity } = queueArr[0];

    // check if user is in the queue
    if (users.includes(message.author.id)) {
        // make channel invisible to user
        message.guild.channels.get(channelID).overwritePermissions(message.author, { 'VIEW_CHANNEL': false, 'SEND_MESSAGES': false });

        await queueDB.updateOne({ name: queueName }, { 
            $inc: { 
                taken: -1,
            }, 
            $pullAll: { 
                users: [ message.author.id ],
            }, 
        });

        // note the leaving in the queue channel
        const queueEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setDescription(`${message.author} left queue, queue filled: \`${taken -1}/${capacity}\``);
        message.guild.channels.get(channelID).send(queueEmbed);
    }
    else {
        return helper.replyCustomError(message, `Oops! You are not in the queue \`${queueName}\`. Did you type it right?`);
    }
}

module.exports = options;
module.exports.execute = execute;