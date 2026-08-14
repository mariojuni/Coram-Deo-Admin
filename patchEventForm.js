const fs = require('fs');
const file = '/Users/maryow/CoramDeoAdmin/src/features/events/EventFormModal.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('let startTimestamp = null;')) {
  content = content.replace('      if (event) {', `      let startTimestamp = null;
      if (formData.date && formData.startTime) {
        const d = new Date(formData.date);
        const timeMatch = String(formData.startTime).match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const mins = parseInt(timeMatch[2], 10);
          const isPM = timeMatch[3].toUpperCase() === 'PM';
          if (isPM && hours < 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          d.setHours(hours, mins, 0, 0);
          startTimestamp = d;
        }
      }

      if (event) {`);

  content = content.replace('updatedAt: serverTimestamp()', '...(startTimestamp && { startTimestamp }),\n          updatedAt: serverTimestamp()');
  content = content.replace('createdAt: serverTimestamp(),', '...(startTimestamp && { startTimestamp }),\n          createdAt: serverTimestamp(),');
  fs.writeFileSync(file, content);
  console.log('EventFormModal.jsx patched successfully');
} else {
  console.log('EventFormModal.jsx already patched');
}
