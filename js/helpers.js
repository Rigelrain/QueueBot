const config = require('../config/config');

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
};