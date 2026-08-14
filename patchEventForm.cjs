const fs = require('fs');

const parseLogic = `let startTimestamp = null;
    if (event.date && event.startTime) {
      const d = new Date(event.date);
      const timeMatch = String(event.startTime).match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
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

    const docRef = doc(collection(db, 'events'));`;

const file2 = '/Users/maryow/CoramDeoAdmin/src/features/events/eventGeneratorService.js';
let content2 = fs.readFileSync(file2, 'utf8');
if (!content2.includes('let startTimestamp = null;')) {
  content2 = content2.replace('const docRef = doc(collection(db, \'events\'));', parseLogic);
  content2 = content2.replace('createdAt: serverTimestamp(),', '...(startTimestamp && { startTimestamp }),\n      createdAt: serverTimestamp(),');
  fs.writeFileSync(file2, content2);
  console.log('eventGeneratorService.js patched successfully');
}

const file1 = '/Users/maryow/CoramDeoAdmin/src/features/events/EventFormModal.jsx';
let content1 = fs.readFileSync(file1, 'utf8');

if (!content1.includes('let startTimestamp = null;')) {
  content1 = content1.replace('      if (event) {', `      let startTimestamp = null;
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

  content1 = content1.replace('updatedAt: serverTimestamp()', '...(startTimestamp && { startTimestamp }),\n          updatedAt: serverTimestamp()');
  content1 = content1.replace('createdAt: serverTimestamp(),', '...(startTimestamp && { startTimestamp }),\n          createdAt: serverTimestamp(),');
  fs.writeFileSync(file1, content1);
  console.log('EventFormModal.jsx patched successfully');
} else {
  console.log('EventFormModal.jsx already patched');
}
