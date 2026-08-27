const fs = require('fs');
const file = '/Users/maryow/Documents/3_Development/CoramDeoMobile/Coram-Deo-Backend/firestore.rules';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `    match /givingExpenses/{expenseId} {
      allow read: if isSignedIn() && (resource.data.visibility == 'public_summary' || isFinanceOrChurchAdmin(resource.data.churchId));
      allow write: if isFinanceOrChurchAdmin(request.resource.data.churchId) || isFinanceOrChurchAdmin(resource.data.churchId);
    }`;
const newStr = `    match /givingExpenses/{expenseId} {
      allow read: if isSignedIn() && (resource.data.visibility == 'public_summary' || isFinanceOrChurchAdmin(resource.data.churchId));
      allow write: if isFinanceOrChurchAdmin(request.resource.data.churchId) || isFinanceOrChurchAdmin(resource.data.churchId);
    }

    match /expenseCategories/{categoryId} {
      allow read: if isSignedIn();
      allow write: if isFinanceOrChurchAdmin(request.resource.data.churchId) || isFinanceOrChurchAdmin(resource.data.churchId);
    }`;

if (content.includes('match /expenseCategories')) {
  console.log('Rules already patched for expenseCategories.');
} else {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Patched firestore.rules for expenseCategories!");
}
