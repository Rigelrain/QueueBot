const config = require('../config');
const Discord = require('discord.js');

const options = {

    name: 'open',
    aliases: ['start', 'create'],

    usage: '<queue name> <capacity>',
    description: 'Creates a new queue with the given <queue name> and <capacity>.',

    cooldown: 5,
    minArgs: 2,

    roleRestrict: 'middleman',
};

async function execute(message, args, db) {

    const capacity = parseInt(args.pop());
    const name = args.join('-').toLowerCase();

    if (isNaN(capacity) || capacity <= 0) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Queue capacity needs to be a positive number.')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    // limit name length to 20 characters
    if (name.length > 20) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Name is too long. Max 20 chars')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    console.log(`[ INFO ] Creating queue with name "${name}" and capacity ${capacity}`);

    const queueDB = db.collection('queues');

    // look for name in db to see if already used
    const findarr = await queueDB.find({ name: name }).toArray();

    // if name already in use, abort
    if (findarr.length != 0) {
        console.log('[ INFO ]  > Duplicate name. Aborting.');
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! A queue with that name already exists. Please choose a different name.')
            .addField('Usage:', `\`${config.prefix}${options.name} ${options.usage}\``);
        return message.channel.send(errEmbed);
    }

    // create channel w/ perms (only allow needed people access to channel)
    const permissions = [
        { id: message.client.user, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }, // the bot can send
        { id: message.author, allow: ['VIEW_CHANNEL'] }, // queue host can see
        { id: message.guild.id, deny: ['VIEW_CHANNEL'] }, // @everyone cannot
        { id: config.roles.admin, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }, // admin role can send
    ];

    const queueChannel = await message.guild.createChannel(name, {
        type: 'text',
        parent: config.queueCategoryID,
        permissionOverwrites: permissions,
    });

    const queueEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`**Queue \`${name}\`**`)
        .addField(`Capacity:  \` ${capacity} \``, `Host: ${message.author}`);
    queueChannel.send(queueEmbed);

    // add new queue to db
    queueDB.insertOne({
        channelID: queueChannel.id,
        name: name,
        host: message.author.id,
        capacity: capacity,
        taken: 0,
        users: [],
    });

    const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
        .setTitle(`Queue \`${name}\` created.`)
        .setDescription(`Channel: ${queueChannel}`);
    message.channel.send(replyEmbed);

    return;
}

module.exports = options;
module.exports.execute = execute;
