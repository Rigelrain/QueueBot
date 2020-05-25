const config = require('../config');
const Discord = require('discord.js');

const options = {

    name: 'add',
    aliases: ['expand'],

    usage: '<amount>',
    description: 'Adds more capacity to an existing queue. Use only in an existing queue.',

    cooldown: 5,
    minArgs: 1,

    roleRestrict: 'middleman',
};

async function execute(message, args, db) {

    console.log('[ INFO ] Expanding queue');

    const channelID = message.channel.id;

    const queueDB = db.collection('queues');
    const queueArr = await queueDB.find({ channelID: channelID }).toArray();

    // if not in queue channel
    if (queueArr.length == 0) {
        console.log('[ INFO ]  > Duplicate name. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! You need to be in a queue channel to add capacity.');
        return message.channel.send(errEmbed);
    }

    const expandBy = parseInt(args.shift());

    // if amount isnt a valid number
    if (isNaN(expandBy) || expandBy <= 0) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Queue capacity needs to be a positive number.')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    // increase available queue spots
    queueDB.updateOne({ channelID: channelID }, { $inc: { capacity: expandBy } });

    const { capacity, taken } = queueArr[0];

    // confirmation message
    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle(`Available spots increased by ${expandBy}.`)
        .setDescription(`${capacity + expandBy - taken} of ${capacity + expandBy} spots left.`);
    message.channel.send(replyEmbed);

}

module.exports = options;
module.exports.execute = execute;
