const helper = require('../js/helpers');

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
    let qName = args? args.join('-').toLowerCase() : null;
    qName = message.channel.name;

    console.log(`[ DEBUG ] Queue/next called in channel: ${message.channel.name}`);

    const authorID = message.author.id;

    console.log(`[ INFO ] > Getting next in line ${qName? 'of ' + qName : ''}`);

    const queueDB = db.collection('queues');
    const userdataDB = db.collection('userdata');

    // look for queue in db
    const query = { host: authorID };
    if(qName) {
        query.name = qName;
    }
    const queueArr = await queueDB.find(query).toArray();

    // if queue not found, abort
    if (queueArr.length == 0) {
        return helper.replyCustomError(message, 'Oops!', `Could not find your queue ${qName? qName + '. Did you type it right?' : '. Is it your own queue?'}`, `> No queue ${qName? qName : ''} found. Aborting.`);
    }
    // if more than one found, abort and ask for queue name
    if(queueArr.length > 1) {
        return helper.replyCustomError(message, 'Oops!', 'You have more than one queue, please try again giving the name of the queue too.', `> Found too many queues for user ${authorID}. Aborting.`);
    }

    const { name, capacity, users, taken, channelID } = queueArr[0];
    const nextUserID = users.shift(); // the ID of the next-in-line
    if(!nextUserID) {
        return helper.replySuccess(message, 'Queue is empty!');
    }

    // remove user from queue, update the taken
    await queueDB.updateOne({ name: name }, { 
        $inc: { 
            taken: -1,
        }, 
        $pullAll: { 
            users: [ nextUserID ],
        }, 
    });

    const nextUser = await userdataDB.find({userID: nextUserID}).toArray();

    helper.replyToChannel(message, channelID, 'Next up is...', `User: ${nextUser.userID} \nIGN: ${nextUser.ign} \nFrom: ${nextUser.island} \n--- \nQueue now has ${taken-1}/${capacity} members in line`);

    // make channel invisible to the next user
    message.guild.channels.get(channelID).overwritePermissions(nextUser.userID, { 'VIEW_CHANNEL': false, 'SEND_MESSAGES': false });

    return;
}

module.exports = options;
module.exports.execute = execute;