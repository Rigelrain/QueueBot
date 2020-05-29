const config = require('../config/config');
const helper = require('../js/helpers');

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
        return helper.replyCustomError(message, 'Oops! You haven\'t added your info yet.', `Use \`${config.prefix}set\` to set that up`, '> User hasn\'t added info. Aborting.');
    }

    const { ign, island } = userArr[0];

    return helper.replySuccess(message, 'Your info:', `**IGN**: \`${ign || '[no data]'}\` \n**Island**: \`${island || '[no data]'}\``);
}

module.exports = options;
module.exports.execute = execute;
