const config = require('../config/config');
const Discord = require('discord.js');

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
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Could not parse what you\'re trying to set.')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    console.log(`[ INFO ] Updating userdata for user ${message.author.id}`);

    // update that information in the db
    const userdataDB = db.collection('userdata');
    await userdataDB.updateOne({ userID: message.author.id }, { $set: { userID: message.author.id, ign: values[0], island: values[1] } }, { upsert: true });

    console.log(`[ INFO ]  > Userdata set to ${values}`);

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle('Info set.')
        .setDescription(`**IGN**: \`${values[0] || '[no data]'}\` \n**Island name**: \`${values[1] || '[no data]'}\``);
    return message.channel.send(replyEmbed);

}

module.exports = options;
module.exports.execute = execute;
