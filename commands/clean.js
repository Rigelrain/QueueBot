const helper = require('../js/helpers');

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
    console.log(`[ INFO ] > Removing user ${authorID}`);

    const queueDB = db.collection('queues');
    const userdataDB = db.collection('userdata');

    // remove the userId from all queues
    await queueDB.updateMany({}, { $pullAll: { users: [ authorID ] } });
        
    // remove the user from user database
    await userdataDB.deleteOne({userID: authorID});

    return helper.replySuccess(message, 'Deleted!', 'Your data has now been removed.');
}

module.exports = options;
module.exports.execute = execute;