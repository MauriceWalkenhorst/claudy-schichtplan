const { execSync } = require('child_process');
const fs = require('fs');

const ics = execSync('curl -s -L "https://app.quinyx.com/webcal/?id=3072ebeaa4267d7b73850319a397ecf1" --max-time 10', { encoding: 'utf8' });

const events = [];
const lines = ics.split('\n');
let event = {};

lines.forEach(line => {
  if (line.startsWith('DTSTART') && line.includes('TZID')) {
    const match = line.match(/DTSTART;TZID=.*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (match) {
      event.start = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`;
    }
  }
  if (line.startsWith('DTEND') && line.includes('TZID')) {
    const match = line.match(/DTEND;TZID=.*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (match) {
      event.end = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`;
    }
  }
  if (line.startsWith('SUMMARY:')) {
    event.title = line.replace('SUMMARY: ', '').trim();
    event.description = event.title;
  }
  if (line.startsWith('LOCATION:')) {
    event.location = line.replace('LOCATION: ', '').trim();
  }
  
  if (line.trim() === 'END:VEVENT') {
    if (event.start && event.title) {
      events.push(event);
    }
    event = {};
  }
});

fs.writeFileSync('shifts.json', JSON.stringify(events, null, 2));
console.log('Updated', events.length, 'shifts');
