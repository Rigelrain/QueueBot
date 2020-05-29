const helper = require('../js/helpers');

const options = {

    name: 'setign',

    usage: '<In-game name>',
    description: 'Sets your IGN individually for the join queue message.',

    cooldown: 3,
    minArgs: 1,
};

async function execute(message, args, db) {

    console.log(`[ INFO ] Updating userdata for user ${message.author.id}`);

    const value = args.join(' ');

    // update that information in the db
    const userdataDB = db.collection('userdata');
    await userdataDB.updateOne({ userID: message.author.id }, { $set: { userID: message.author.id, ign: value } }, { upsert: true });

    const userArr = await userdataDB.find({ userID: message.author.id }).toArray();
    const { ign, island } = userArr[0];

    console.log(`[ INFO ]  > IGN set to ${value}`);

    return helper.replySuccess(message, 'IGN set.', `**IGN**: \`${ign || '[no data]'}\` \n**Island**: \`${island || '[no data]'}\``);
}

module.exports = options;
module.exports.execute = execute;
