const config = require('../config/config');
const Discord = require('discord.js');

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

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`Currently ${findarr.length} active queues.`);

    console.log(`[ INFO ]  > ${findarr.length} currently active.`);

    let reply = '';
    findarr.forEach((elem) => {
        // ~ reply += `\n<#${elem.channelID}>: `;
        reply += `\n**${elem.name}**: (host: <@${elem.host}>), `;
        reply += elem.available == 0 ? 'No spaces left.' : `${elem.taken} / ${elem.capacity}.`;
    });
    replyEmbed.setDescription(reply);

    message.channel.send(replyEmbed);

}

module.exports = options;
module.exports.execute = execute;
