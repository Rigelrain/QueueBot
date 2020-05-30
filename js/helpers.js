const config = require('../config/config');
const Discord = require('discord.js');

const adminRole = process.env.ADMIN || require('../config/id-config').roles.admin;
const middlemanRole = process.env.MIDDLEMAN || require('../config/id-config').roles.middleman;

module.exports = {
    checkRole(member, role) {
        // console.log(`[ DEBUG ] Checking to see if they have ${role} role`);

        // console.log(`[ DEBUG ] using roles admin(${adminRole}) and middleman(${middlemanRole})`);

        let roleMatch = false;

        switch(role) {
        case 'admin':
            if(member.roles.has(adminRole)) {
                roleMatch = true;
            }
            break;
        case 'middleman':
            if(member.roles.has(middlemanRole)) {
                roleMatch = true;
            }
            break;
        default:
            console.log(`[ ERROR ] Invalid role ${role} being checked.`);
            break;
        }

        return roleMatch;
    },
    returnRoleName(message, role) {

        let roleID;

        switch(role) {
        case 'admin':
            roleID = adminRole;
            break;
        case 'middleman':
            roleID = middlemanRole;
            break;
        default:
            console.log(`[ ERROR ] Invalid role ${role} being checked.`);
            break;
        }

        return message.guild.roles.get(roleID).name;
    },
    replyGeneralError(message, err) {
        console.log(`[ ERROR ] ${JSON.stringify(err, null, 2)}`);
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
            .setTitle(title? title : 'Oops!')
            .setDescription(description? description : '');
        return message.channel.send(errEmbed);
    },
    replySuccess(message, title, description) {
        const replyEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setTitle(title? title : 'Success!')
            .setDescription(description? description : '');
        return message.channel.send(replyEmbed);
    },
    replyToChannel(message, channelID, title, description) {
        const queueEmbed = new Discord.RichEmbed().setColor(config.colors.success)
            .setTitle(title? title : 'Hello!')
            .setDescription(description? description : '');
        message.guild.channels.get(channelID).send(queueEmbed);
    },
};