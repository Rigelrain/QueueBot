const config = require('../config/config');
const Discord = require('discord.js');

const options = {

    name: 'help',
    aliases: ['info', '?', 'h'],

    description: 'Shows this list of commands.',

    cooldown: 5,
};
/* == HELP MESSAGE FORMAT ==
 * $NAME ($ALIASES)
 * $DESCRIP
 * Usage:
 *   $USAGE
 * Examples:
 *   $EXAMPLE
 */

async function execute(message) {

    console.log('[ INFO ] Showing help');

    const commands = message.client.commands;

    const helpEmbed = new Discord.RichEmbed().setColor(config.colors.info)
        .setAuthor('QueueBot Help', message.client.user.displayAvatarURL)
        .setFooter('QueueBot created by WholeWheatBagels', 'https://cdn.discordapp.com/avatars/197460469336899585/efb49d183b81f30c42b25517e057a704.png');

    commands.forEach((cmd) => {

        //               .. only show role-restricted commands if member is in a server and they have that role
        if (!cmd.roleRestrict || (cmd.roleRestrict && message.guild && message.member.roles.has(config.roles[`${cmd.roleRestrict}`]))) {

            let helpStr = cmd.description;

            if (cmd.usage) {
                helpStr += `\n\`${config.prefix}${cmd.name} ${cmd.usage}\``;
            }
            else {
                helpStr += `\n\`${config.prefix}${cmd.name}\``;
            }

            if (cmd.example) {
                helpStr += `\nExample:\n- \`${config.prefix}${cmd.name} ${cmd.example}\``;
            }

            if (cmd.roleRestrict) {
                const roleID = config.roles[`${cmd.roleRestrict}`];
                helpStr += `\n*(Restricted to @${ message.guild.roles.get(roleID).name } only)*`;
            }

            helpEmbed.addField(`**${cmd.name}**` + (cmd.aliases ? ', ' + cmd.aliases.join(', ') : ''), helpStr);

        }
    });

    message.channel.send(helpEmbed);

}

module.exports = options;
module.exports.execute = execute;
