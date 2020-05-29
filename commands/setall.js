const config = require('../config/config');
const helper = require('../js/helpers');

const options = {

    name: 'set',
    aliases: ['setall'],

    usage: '<IGN> | <Island name>',
    description: 'Sets your queue display info for the join queue message.',

    cooldown: 3,
    minArgs: 3,
};

async function execute(message, args, db) {

    const values = args.join(' ').split(' | ');

    if (values.length != 2) {
        return helper.replyCustomError(message, 'Oops! Could not parse what you\'re trying to set.', `Usage: \`${config.prefix}${options.name} ${options.usage}\``);
    }

    console.log(`[ INFO ] Updating userdata for user ${message.author.id}`);

    // update that information in the db
    const userdataDB = db.collection('userdata');
    await userdataDB.updateOne({ userID: message.author.id }, { $set: { userID: message.author.id, ign: values[0], island: values[1] } }, { upsert: true });

    console.log(`[ INFO ]  > Userdata set to ${values}`);

    return helper.replySuccess(message, 'Info set.', `**IGN**: \`${values[0] || '[no data]'}\` \n**Island name**: \`${values[1] || '[no data]'}\``);
}

module.exports = options;
module.exports.execute = execute;
