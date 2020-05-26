const config = require('../config/config');
const Discord = require('discord.js');

const options = {

    name: 'me',
    aliases: ['myinfo'],

    description: 'Shows the info you\'ve added for the queue message',

    cooldown: 3,
};

async function execute(message, args, db) {

    console.log(`[ INFO ] Showing userdata for user ${message.author.id}`);

    const userdataDB = db.collection('userdata');
    const userArr = await userdataDB.find({ userID: message.author.id }).toArray();

    // if userdata not found, abort
    if (userArr.length == 0) {
        console.log('[ INFO ]  > User hasn\'t added info. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! You haven\'t added your info yet.')
            .setDescription(`Use \`${config.prefix}set\` to set that up`);
        return message.channel.send(errEmbed);
    }

    const { ign, island } = userArr[0];

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle('Your info:')
        .setDescription(`**IGN**: \`${ign || '[no data]'}\` \n**Island**: \`${island || '[no data]'}\``);
    return message.channel.send(replyEmbed);
}

module.exports = options;
module.exports.execute = execute;
