const config = require('../config/config');
const helper = require('../js/helpers');

const options = {

    name: 'setfc',

    usage: 'SW-####-####-####',
    description: 'Sets your friendcode individually for the join queue message.',

    cooldown: 3,
    minArgs: 1,
};

async function execute(message, args, db) {

    console.log(`[ INFO ] Updating userdata for user ${message.author.id}`);

    let value = args.join(' ');

    // if not a valid code, abort
    const fcRegex = new RegExp(/(SW-)?[0-9]{4}-[0-9]{4}-[0-9]{4}/);
    if (!(fcRegex.test(value))) {
        return helper.replyCustomError(message, 'Oops! Could not parse friendcode. Is it formatted correctly?', `Usage: \`${config.prefix}${options.name} ${options.usage}\``, '> Bad friendcode. Aborting.');
    }
    if (value.length == 14) { value = `SW-${value}`; }

    // update that information in the db
    const userdataDB = db.collection('userdata');
    await userdataDB.updateOne({ userID: message.author.id }, { $set: { userID: message.author.id, fc: value } }, { upsert: true });

    const userArr = await userdataDB.find({ userID: message.author.id }).toArray();
    const { fc, ign, island } = userArr[0];

    console.log(`[ INFO ]  > Friendcode set to ${value}`);

    return helper.replySuccess(message, 'Friendcode set.', `**IGN**: \`${ign || '[no data]'}\` \n**Island**: \`${island || '[no data]'}\` \n**Friendcode**: \`${fc || '[no data]'}\``);
}

module.exports = options;
module.exports.execute = execute;
