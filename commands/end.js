const config = require('../config/config');
const Discord = require('discord.js');

const options = {

    name: 'close',
    aliases: ['delete', 'end'],

    usage: '<queue name>',
    description: 'Ends queue with name <queue name> (if found).',

    cooldown: 5,
    minArgs: 1,

    roleRestrict: 'middleman',
};

async function execute(message, args, db) {

    const name = args.join('-').toLowerCase();

    const queueDB = db.collection('queues');

    console.log(`[ INFO ] Deleting queue "${name}"`);

    // look for name in db to see if already used
    const findarr = await queueDB.find({ name: name }).toArray();

    // if name not found, abort
    if (findarr.length == 0) {
        console.log('[ INFO ]  > No queue by that name. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle(`Oops! Could not find queue \`${name}\`. Did you type it right?`);
        return message.channel.send(errEmbed);
    }

    // delete channel
    const channelID = findarr[0].channelID;
    message.guild.channels.get(channelID).delete();

    if (findarr[0].random) {
        message.guild.channels.get(config.queueListChannelID).fetchMessage(findarr[0].listMsgID).then(msg => msg.delete());
    }

    // delete from database
    queueDB.deleteOne({ name: name });

    console.log('[ INFO ]  > Queue deleted.');

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle(`Queue \`${name}\` deleted.`);
    message.channel.send(replyEmbed);
}

module.exports = options;
module.exports.execute = execute;
