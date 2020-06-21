const config = require('../config/config');
const Discord = require('discord.js');
const helper = require('../js/helpers');

const options = {

    name: 'create',
    aliases: ['start', 'open'],

    usage: '<queue name> <capacity>',
    description: 'Creates a new queue with the given <queue name> and <capacity>.',

    cooldown: 5,
    minArgs: 2,

    roleRestrict: 'middleman',
};

async function execute(message, args, db) {
    // console.log(`[ DEBUG ] Creating queue started with args: ${JSON.stringify(args, null, 2)}`);

    const capacity = parseInt(args.pop());
    const name = args.join('-').toLowerCase();

    if (isNaN(capacity) || capacity <= 0) {
        return helper.replyCustomError(message, 'Oops! Queue capacity needs to be a positive number.', `Usage: \`${config.prefix}${options.name} ${options.usage}\``, `Cannot create queue because invalid capacity: ${capacity}`);
    }

    // limit name length to 20 characters
    if (name.length > 20) {
        return helper.replyCustomError(message, 'Oops! Name is too long. Max 20 chars.', `Usage: \`${config.prefix}${options.name} ${options.usage}\``, `Cannot create queue because invalid name length: ${name.length}`);
    }

    console.log(`[ INFO ] Creating queue with name "${name}" and capacity ${capacity}`);

    const adminID = process.env.ADMIN || require('../config/id-config').roles.admin;

    const queueDB = db.collection('queues');

    // look for name in db to see if already used
    const findarr = await queueDB.find({ name: name }).toArray();

    // if name already in use, abort
    if (findarr.length != 0) {
        return helper.replyCustomError(message, 'Oops! A queue with that name already exists. Please choose a different name.', `Usage: \`${config.prefix}${options.name} ${options.usage}\``, '> Duplicate name. Aborting.');
    }

    // create channel w/ perms (only allow needed people access to channel)
    const permissions = [
        { id: message.client.user, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_CHANNELS'] }, // the bot can send and manage the channel
        { id: message.author, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] }, // queue host can see and send
        { id: message.guild.id, deny: ['VIEW_CHANNEL'] }, // @everyone cannot
        { id: adminID, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES','READ_MESSAGE_HISTORY'] }, // admin role can send
    ];

    const queueChannel = await message.guild.createChannel(name, {
        type: 'text',
        parent: process.env.CATEGORYID || require('../config/id-config').queueCategoryID,
        permissionOverwrites: permissions,
    });

    const queueEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setTitle(`**Queue ${name}**`)
        .setDescription(config.queueCreateMsg)
        .addField(`Capacity:  \` ${capacity} \``, `Host: ${message.author}`)
        .addField('Relevant commands:', `Leave queue: \`${config.prefix} leave\` (you will lose this channel and your spot in this queue)
        Get next in line (host only): \`${config.prefix} next\`
        End queue (host only): \`${config.prefix} end\``);
    queueChannel.send(queueEmbed);

    // add new queue to db
    queueDB.insertOne({
        channelID: queueChannel.id,
        name: name,
        host: message.author.id,
        capacity: capacity,
        taken: 0,
        done: 0,
        users: [],
    });

    helper.replySuccess(message, `Queue \`${name}\` created.`, `Channel: ${queueChannel}`);

    return;
}

module.exports = options;
module.exports.execute = execute;
