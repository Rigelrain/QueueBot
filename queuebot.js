console.log('[ START ] Starting up...');
const Discord = require('discord.js');
const client = new Discord.Client();

// file i/o
const fs = require('fs');

// grab settings from file
const { token } = require('./token.json');
const config = require('./config');

// connect to mongodb server
const MongoClient = require('mongodb').MongoClient;
const mdbconf = require('./mongodb_config.json');
mdbconf.port = mdbconf.port || '27017';
// ~ const mongoURL = `mongodb://${mdbconf.user}:${mdbconf.pass}@${mdbconf.host}:${mdbconf.port}/`;
const mongoURL = `mongodb://${mdbconf.host}:${mdbconf.port}/`;
let db;

// import commands from dir
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require('./commands/' + file);
    client.commands.set(command.name, command);

    console.log(`[ START ] Added command: ${command.name}`);
}

const cooldowns = new Discord.Collection();


// ========


client.once('ready', () => {
    console.log('[ START ] Ready.');
});

client.on('message', message => {

    // ignore messages that dont start with a valid prefix
    if (!message.content.startsWith(config.prefix)) { return; }

    // ignore bot messages
    if (message.author.bot) { return; }

    // ignore DMs
    if (message.channel.type !== 'text') { return; }

    // ignore messages not in specified channels, if given
    if (config.restrictToChannels && !config.restrictToChannels.includes(message.channel.id)) { return; }

    // turn message into array
    const args = message.content.trim().slice(config.prefix.length).split(/ +/);

    // pull first word (the command) out
    const commandName = args.shift().toLowerCase();

    // get command from name or alias
    const command = client.commands.get(commandName) ||
					client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;


    //   ===   CHECK COMMAND OPTIONS   ===


    // role restricted
    if (command.roleRestrict && !message.member.roles.has(config.roles[`${command.roleRestrict}`])) { return; }

    // argument count
    if (command.minArgs && args.length < command.minArgs) {
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops! Are you missing something?')
            .addField('Usage:', `\`${config.prefix}${command.name} ${command.usage}\``);
        return message.channel.send(errEmbed);
    }

    // == COOLDOWN HANDLING ==
    if (command.cooldown) {
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
                    .setTitle(`Wait ${timeLeft.toFixed(1)} more second(s) to call this again.`);
                return message.channel.send(errEmbed);
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    // ==============
    // ACTUAL COMMAND CALL
    command.execute(message, args, db)
        .catch(err => {
            console.error(`[ ERROR ] ${err}`);
            message.reply('there was an error trying to execute that command!');
        });

});

// Use events to grab reaction add/removes since builtin collector doesnt track what user reacted
// Actual handling in random queue command
client.on('messageReactionAdd', (reaction, user) => {
    if (user.id == client.user.id) return; // ignore self react
    client.commands.get('random').reactAdd(reaction, user, client, db);
});
client.on('messageReactionRemove', (reaction, user) => {
    if (user.id == client.user.id) return; // ignore self react
    client.commands.get('random').reactRemove(reaction, user, client, db);
});

// Use raw listener to catch uncached reaction events
// (from https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md)
client.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = client.channels.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
});


// ========


// Login to database and Discord
// but only login to Discord once db is ready
console.log(`[ START ] Connecting to MongoDB... ( ${mongoURL} )`);
MongoClient.connect(mongoURL, function(err, mongoclient) {
    if (err) { throw err; }

    db = mongoclient.db(mdbconf.dbname);

    console.log('[ START ] Logging in to Discord...');
    client.login(token);
});

// catch and log promise rejections
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));
