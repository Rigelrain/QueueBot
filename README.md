# QueueBot
Originally made by detjensrobert as a [Pokemon Sword & Shield Discord QueueBot](https://github.com/detjensrobert/QueueBot).

Adapted from there to work as a queue bot for Animal Crossing New horizons.

------------

## Overview

This bot manages creation and moderation of queue channels. Users can create a queue with a certain capacity, and other users can join the queue until the capcity is reached.

When a user joins a queue, the bot posts a message with that user's information in the queue's channel like so:

`Position: ## | IGN: ## | Island: ## ` 

Queue channels are visible to everyone, but only QueueBot, the queue host, queue members, and a configurable admin role can send messages.

------------

## Usage
- `!queue open <queue-name> <length>`

	Creates a new queue with the given name and length, and a new channel `#queue-<queue-name>` under a configured category.

	Can only be called by authorised users (with a specified role e.g. Middlemen).
	
	The resultant channel is only visible to the queue members and a queue admin role.

- `!queue random <queue-name> <length>`

	Creates a new *random* queue with the given name and length, and a new channel `#queue-<queue-name>` under a configured category.
	
	Since this is a random queue, a message is sent to the `#queue-list` (or configured) channel. Users react to this message to join.

 	Can only be called by authorised users (with a specified role e.g. Middlemen).
	
	The resultant channel is only visible to the queue members and a queue admin role.

- `!queue join <queue-name>`

	Adds user to queue `<queue-name>` (if it exists), and posts their info in that queue's channel.

- `!queue set <In-game name> | <Island name>`

	Users can set their profile data for the join message.
	
- `!queue me`

	Displays the queue information a user has entered for the join message.
	
- `!queue add <amount>`

	Adds <amount> more capacity to an exising queue.

- `!queue close <queue-name>`

	Deletes queue and the associated channel.
	
	Can only be called by authorised users (with a specified role e.g. Middlemen).
	
- `!queue list`

	Lists currently active queues, their channels, and open seats.
	
- `!queue help`

	Displays a help message with commands and their usages.

------------

## Setup
Main file is `queuebot.js`.  `npm start` will start the bot.

Configuration files are under `/config`.

### General configurations

General configurations are in `/config/config.js`:
- bot prefix
- colors
- reaction emoji
- time to wait until a user is kicked out of channel after being picked from queue

### Server-specific configurations

This configuration holds information about the server categories, channels and roles through their IDs. Since these are specific to your own server, the actual IDs are not in version control.

First make a copy or rename the id-config-template.js file. New file should be named `id-config.js`. Overwrite the fields as you see fit.

### Discord Access configuration

Bot token goes in `token.js`. Create if not present:
```
{
  "token": "TOKEN HERE"
}
```

### Mongo database
MongoDB settings go in `mongodb_config.js`. Create if not present:
```
const params = {
    user: 'USERNAME',
    pass: 'PASSWORD',
};

module.exports = {
    dbname: 'DATABASE NAME',
    path: `PATH TO MONGO DB`, // you can utilise the username and password set in params object
};
```
The bot will use collections `queues` and `userdata`.

**Queues schema**
```
{
	channelID: ID,
	name: String,
	host: ID,
	capacity: Number, // total amount of people that the host allows in the queue
	taken: Number, // the amount of slots in queue that have been claimed
	done: Number, // amount of people who are done, and are not waiting anymore
	users: [ID],
}
```

**Userdata schema**
```
{ 
	userID: ID, 
	ign: String, 
	island: String,
}
```

Make sure the bot has react permissions in the configured `#queue-list` channel!

## Deployment
This bot is configured to be deployed to Heroku.

Sensitive tokens should be saved into Heroku Dashboard in Config Vars. In code these are read as `process.env.<key>`. Add the following 'keys' to the Config Vars:
- TOKEN - Discord bot token
- DBPATH - Path to Mongo database in full
- DBNAME - Name of the database with these collections
- CATEGORYID - ID of the queue category
- LISTCHANNELID - ID of the queue list channel
- MIDDLEMAN - ID of the role that can act as middleman
- ADMIN - ID of the role that can act as admin/moderator