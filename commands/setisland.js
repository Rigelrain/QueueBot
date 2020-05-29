const helper = require('../js/helpers');


const options = {

    name: 'setisland',

    usage: '<Island name>',

    description: 'Sets your island name individually for the join queue message.',

    cooldown: 3,
    minArgs: 1,
};

async function execute(message, args, db) {

    console.log(`[ INFO ] Updating userdata for user ${message.author.id}`);

    const value = args.join(' ');

    // update that information in the db
    const userdataDB = db.collection('userdata');
    await userdataDB.updateOne({ userID: message.author.id }, { $set: { userID: message.author.id, island: value } }, { upsert: true });

    const userArr = await userdataDB.find({ userID: message.author.id }).toArray();
    const { ign, island } = userArr[0];

    console.log(`[ INFO ]  > Island set to ${value}`);

    return helper.replySuccess(message, 'Island name set.', `**IGN**: \`${ign || '[no data]'}\` \n**Island**: \`${island || '[no data]'}\``);
}

module.exports = options;
module.exports.execute = execute;
