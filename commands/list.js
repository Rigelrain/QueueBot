const helper = require('../js/helpers');

const options = {

    name: 'list',
    aliases: ['l', 'ls', 'all', 'a'],

    description: 'Lists all currently active queues.',

    cooldown: 5,
};

async function execute(message, args, db) {

    console.log('[ INFO ] Listing queues.');

    // get all queues in database
    const queueDB = db.collection('queues');
    const findarr = await queueDB.find().toArray();

    console.log(`[ INFO ]  > ${findarr.length} currently active.`);

    let reply = '';
    findarr.forEach((elem) => {
        // ~ reply += `\n<#${elem.channelID}>: `;
        reply += `\n**${elem.name}**: (host: <@${elem.host}>), `;
        reply += elem.available == 0 ? 'No spaces left.' : `${elem.taken} / ${elem.capacity}.`;
    });

    return helper.replySuccess(message, `Currently ${findarr.length} active queues.`, reply);
}

module.exports = options;
module.exports.execute = execute;
