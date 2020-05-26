const config = require('../config/config');
const Discord = require('discord.js');

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
        console.log('[ INFO ]  > Bad friendcode. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Could not parse friendcode. Is it formatted correctly?')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }
    if (value.length == 14) { value = `SW-${value}`; }

    // update that information in the db
    const userdataDB = db.collection('userdata');
    await userdataDB.updateOne({ userID: message.author.id }, { $set: { fc: value } }, { upsert: true });

    const userArr = await userdataDB.find({ userID: message.author.id }).toArray();
    const { fc, ign, island } = userArr[0];

    console.log(`[ INFO ]  > Friendcode set to ${value}`);

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle('Friendcode set.')
        .setDescription(`**IGN**: \`${ign || '[no data]'}\` \n**Island**: \`${island || '[no data]'}\` \n**Friendcode**: \`${fc || '[no data]'}\``);
    return message.channel.send(replyEmbed);
}

module.exports = options;
module.exports.execute = execute;
