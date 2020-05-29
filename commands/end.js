const config = require('../config/config');
const helper = require('../js/helpers');

const options = {

    name: 'close',
    aliases: ['delete', 'end'],

    usage: '[queue name]',
    description: 'Ends queue with name <queue name> (if found).',

    cooldown: 5,

    roleRestrict: 'middleman',
};

async function execute(message, args, db) {
    let queueName = args.join('-').toLowerCase();
    if(!queueName || queueName.length === 0) {
        // maybe command was given in a queue channel
        queueName = message.channel.name;
    }

    const queueDB = db.collection('queues');

    console.log(`[ INFO ] Deleting queue "${queueName}"`);

    // look for name in db to see if already used
    const findarr = await queueDB.find({ name: queueName }).toArray();

    // if name not found, abort
    if (findarr.length == 0) {
        return helper.replyCustomError(message, `Oops! Could not find queue \`${queueName}\`.`, 'You should either write this in the queue channel or check the spelling.', `> No queue ${queueName} found. Aborting.`);
    }

    // delete channel
    const channelID = findarr[0].channelID;
    message.guild.channels.get(channelID).delete();

    // this is to delete the random queue message, so members cannot react anymore
    if (findarr[0].random) {
        message.guild.channels.get(config.queueListChannelID).fetchMessage(findarr[0].listMsgID).then(msg => msg.delete());
    }

    // delete from database
    queueDB.deleteOne({ name: queueName });

    console.log(`[ INFO ]  > Queue "${queueName}" deleted.`);

    // send the deletion confirmation to the list channel
    await helper.replyToChannel(message, config.queueListChannelID, `Queue \`${queueName}\` deleted.`);

    return;
}

module.exports = options;
module.exports.execute = execute;
