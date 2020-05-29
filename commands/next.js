const helper = require('../js/helpers');
const config = require('../config/config');

const options = {

    name: 'next',

    usage: '[queue-name]',
    description: 'Returns the next in line of your queue. If you have more than one queue, please specify the name of your queue.',

    cooldown: 3,
    minArgs: 0,

    roleRestrict: 'middleman', // this command is not really for our purposes, so skip it
};

// eslint-disable-next-line no-unused-vars
async function execute(message, args, db) {

    let queueName = args.join('-').toLowerCase();
    if(!queueName || queueName.length === 0) {
        // maybe command was given in a queue channel
        queueName = message.channel.name;
    }

    console.log(`[ DEBUG ] Queue/next called in channel: ${message.channel.name}`);

    console.log(`[ INFO ] > Getting next in line ${queueName}`);

    const queueDB = db.collection('queues');
    const userdataDB = db.collection('userdata');

    // look for queue in db, by the host
    const queueArr = await queueDB.find({name: queueName, host: message.author.id}).toArray();

    // if queue not found, abort
    if (queueArr.length == 0) {
        return helper.replyCustomError(message, 'Oops!', 'Could not find your queue. Make sure you use this command in the queue channel or type the queue name correctly.', `> No queue ${queueName} found. Aborting.`);
    }

    const { name, capacity, users, taken, done, channelID } = queueArr[0];
    const nextUserID = users.shift(); // the ID of the next-in-line
    if(!nextUserID) {
        return helper.replySuccess(message, 'Queue is empty!');
    }

    // remove user from queue, update the taken
    await queueDB.updateOne({ name: name }, { 
        $inc: { 
            done: 1,
        }, 
        $pullAll: { 
            users: [ nextUserID ],
        }, 
    });

    const nextUser = await userdataDB.find({userID: nextUserID}).toArray();

    await helper.replyToChannel(message, channelID, 'Next up is...', `User: <@${nextUser.userID}> \nIGN: ${nextUser.ign} \nFrom: ${nextUser.island} \n--- \nQueue now has ${taken-done-1} members in line. \nThere's still room for ${capacity-taken} people.`);

    // make channel invisible to the next user after a timeout
    setTimeout(function(){
        message.guild.channels.get(channelID).overwritePermissions(nextUser.userID, { 'VIEW_CHANNEL': false, 'SEND_MESSAGES': false });
    }, config.nextWaitTime);

    return;
}

module.exports = options;
module.exports.execute = execute;