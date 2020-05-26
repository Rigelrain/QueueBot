module.exports = {
    prefix: '!queue ',
	
    colors: {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warn: '#FFC107',
    },
	
    reactEmoji: '💟',
    // TODO instead of IDs, we could have names in config
    // and find the IDs in code in startup:
    // message.guild.roles.find()
    
    // right-click on the category to copy the ID
    queueCategoryID: '714561232304078868',
    // right-click on the channel to copy the ID
    queueListChannelID: '714564139845943339',
	
    roles: {
        // these are the role IDs that can start queues
        middleman: [ '714560785615028266' ],
        // a moderator-level role IDs
        admin: [ '714564470277537965' ],
    },
};