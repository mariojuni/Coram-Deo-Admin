const fs = require('fs');

const parseLogic = `let startTimestamp = null;
    if (event.date && event.startTime) {
      const d = new Date(event.date);
      const timeStr = String(event.startTime).trim();
      const timeMatch12 = timeStr.match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
      const timeMatch24 = timeStr.match(/^(\\d{1,2}):(\\d{2})$/);
      
      if (timeMatch12) {
        let hours = parseInt(timeMatch12[1], 10);
        const mins = parseInt(timeMatch12[2], 10);
        const isPM = timeMatch12[3].toUpperCase() === 'PM';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        d.setHours(hours, mins, 0, 0);
        startTimestamp = d;
      } else if (timeMatch24) {
        const hours = parseInt(timeMatch24[1], 10);
        const mins = parseInt(timeMatch24[2], 10);
        d.setHours(hours, mins, 0, 0);
        startTimestamp = d;
      }
    }

    const docRef = doc(collection(db, 'events'));`;

const file2 = '/Users/maryow/CoramDeoAdmin/src/features/events/eventGeneratorService.js';
let content2 = fs.readFileSync(file2, 'utf8');

// Replace the old parsing logic with the new one
content2 = content2.replace(/let startTimestamp = null;[\s\S]*?const docRef = doc\(collection\(db, 'events'\)\);/, parseLogic);
fs.writeFileSync(file2, content2);
console.log('eventGeneratorService.js patched successfully for 24h format');

const parseLogic1 = `let startTimestamp = null;
      if (formData.date && formData.startTime) {
        const d = new Date(formData.date);
        const timeStr = String(formData.startTime).trim();
        const timeMatch12 = timeStr.match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
        const timeMatch24 = timeStr.match(/^(\\d{1,2}):(\\d{2})$/);
        
        if (timeMatch12) {
          let hours = parseInt(timeMatch12[1], 10);
          const mins = parseInt(timeMatch12[2], 10);
          const isPM = timeMatch12[3].toUpperCase() === 'PM';
          if (isPM && hours < 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          d.setHours(hours, mins, 0, 0);
          startTimestamp = d;
        } else if (timeMatch24) {
          const hours = parseInt(timeMatch24[1], 10);
          const mins = parseInt(timeMatch24[2], 10);
          d.setHours(hours, mins, 0, 0);
          startTimestamp = d;
        }
      }

      if (event) {`;

const file1 = '/Users/maryow/CoramDeoAdmin/src/features/events/EventFormModal.jsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/let startTimestamp = null;[\s\S]*?if \(event\) {/, parseLogic1);
fs.writeFileSync(file1, content1);
console.log('EventFormModal.jsx patched successfully for 24h format');
