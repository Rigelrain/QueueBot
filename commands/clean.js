const config = require('../config/config');
const Discord = require('discord.js');

/**
 * This command is for members in the queue to leave the queue,
 * signalling that they have done what they queue'd for
 */

const options = {

    name: 'clean',

    aliases: ['removeme', 'purge', 'removedata', 'delete'],

    usage: '',
    description: 'Removes your user data from the bot. Also removes from all queues you are currently in,.',

    cooldown: 3,
    minArgs: 0,
};

// eslint-disable-next-line no-unused-vars
async function execute(message, args, db) {

    const authorID = message.author.id;

    const queueDB = db.collection('queues');
    const userdataDB = db.collection('userdata');

    try {
        // remove the userId from all queues
        await queueDB.updateMany({}, { $pullAll: { users: [ authorID ] } });
        
        // remove the user from user database
        await userdataDB.deleteOne({userID: authorID});

        const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setTitle('Deleted!')
            .setDescription('Your data has now been removed.');
        return message.channel.send(replyEmbed);
    }
    catch(err) {
        const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setTitle('Oops!')
            .setDescription('Something went wrong with this command...');
        return message.channel.send(replyEmbed);
    }
}

module.exports = options;
module.exports.execute = execute;