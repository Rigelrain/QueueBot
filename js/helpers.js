const config = require('../config/config');
const Discord = require('discord.js');

module.exports = {
    checkRole(member, role) {
        // console.log(`[ DEBUG ] Checking to see if they have ${role} role`);
        if(member.roles.some(r => config.roles[role].includes(r.id))) {
            return true;
        }
        else {
            return false;
        }
    },
    replyGeneralError(message, err) {
        console.log(`[ ERROR ] ${JSON.stringify(err, null ,2)}`);
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle('Oops!')
            .setDescription('Something went wrong with this command...');
        return message.channel.send(errEmbed);
    },
    replyCustomError(message, title, description, err) {
        if(err) {
            console.log(`[ ERROR ] ${err}`);
        }
        const errEmbed = new Discord.RichEmbed().setColor(config.colors.error)
            .setTitle(title)
            .setDescription(description? description : '');
        return message.channel.send(errEmbed);
    },
    replySuccess(message, title, description) {
        const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setTitle(title)
            .setDescription(description);
        return message.channel.send(replyEmbed);
    },
    replyToChannel(message, channelID,title, description) {
        const queueEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setTitle(title)
            .setDescription(description);
        message.guild.channels.get(channelID).send(queueEmbed);
    },
};