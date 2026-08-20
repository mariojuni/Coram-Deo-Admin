const fs = require('fs');
const file = '/Users/maryow/Documents/3_Development/CoramDeoMobile/Coram-Deo-Backend/firestore.rules';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `      allow write: if isPastorOrAdmin(request.resource.data.churchId)
        || isAssignedMinistryLeader(request.resource.data.churchId, request.resource.data.ministryId);`;
const newStr = `      allow create, update: if isPastorOrAdmin(request.resource.data.churchId)
        || isAssignedMinistryLeader(request.resource.data.churchId, request.resource.data.ministryId);
      allow delete: if isPastorOrAdmin(resource.data.churchId)
        || isAssignedMinistryLeader(resource.data.churchId, resource.data.ministryId);`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content);
console.log("Patched!");
