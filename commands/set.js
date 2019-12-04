module.exports = {
	
	// Command options
	name: 'set',
	aliases: ['setinfo'],
	
	usage: 'fc (SW-)XXXX-XXXX-XXXX / ign <name> / switch <Switch profile name>',
	description: 'Sets your queue display info for the join queue message.\
	\nEx: `Position: 5 | Switch Profile: Bagels | IGN: Bagels | Friendcode: SW-1234-5678-9000`',
	
	cooldown: 5,
	
	execute: (message, args, db) => {
				
		const option = args.shift();
		const value = args.join(' ');
		
		if (value.length == 0) {
			let reply = `🚫 I don't understand what you're trying to set.`;
					+ `\n**Usage:** \`${prefix}${this.name} ${this.usage}\``;
		}
		
		let updated;
		
		switch (option) {
			case 'fc':
				//if not a valid code
				if ( !(fc.match(/(SW-)?[0-9]{3}-[0-9]{3}-[0-9]{3}/) )) {
					let reply = `🚫 I dont't understand this friendcode.\nIs it formatted correctly?`
						+ `\n **Usage:** \`${prefix}${this.name} fc (SW-)####-####-#### \``;
				}
				updated = "Friendcode";
				break;
			case 'ign':
				
				updated = "IGN";
				break;
			case 'switch':
				updated = "Switch profile name";
				break;
			default:
				let reply = `🚫 I don't understand what you're trying to set.`;
					+ `\n**Usage:** \`${prefix}${this.name} ${this.usage}\``;
				return message.reply(reply);
		}
		
		const userdataDB = db.collection('userdata');
	
		userdataDB.updateOne({ userID: message.author.id }, { $set: {option: value} });
		
		message.channel.send("✅ "+updated+" set!");
		
	}
}

async function setFC(message, fc, db) {
	
	
}
