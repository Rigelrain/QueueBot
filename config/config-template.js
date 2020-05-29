module.exports = {
    prefix: '!queue ',
	
    colors: {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warn: '#FFC107',
    },
	
    reactEmoji: '💟',
    
    // right-click on the category to copy the ID
    queueCategoryID: '424242424242424242',
    // right-click on the channel to copy the ID
    queueListChannelID: '424242424242424242',
    queueCreateMsg: '',
	
    roles: {
        // these are the role IDs that can start queues
        middleman: [ '424242424242424242', '424242424242424242' ],
        // a moderator-level role IDs
        admin: [ '424242424242424242', '424242424242424242' ],
    },

    nextWaitTime: 300000, // how long a member is kept in queue channel before kick
};