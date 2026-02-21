const { execSync } = require('child_process');
const fs = require('fs');

const QUINYX_URL = 'https://app.quinyx.com/webcal/?id=3072ebeaa4267d7b73850319a397ecf1';

try {
  console.log(`[${new Date().toISOString()}] Fetching shifts from Quinyx...`);

  const ics = execSync(
    `curl -s -L "${QUINYX_URL}" --max-time 30 --fail`,
    { encoding: 'utf8' }
  );

  if (!ics || !ics.includes('BEGIN:VCALENDAR')) {
    throw new Error('Invalid iCal response from Quinyx');
  }

  const events = [];
  const lines = ics.split('\n');
  let event = {};

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith('DTSTART') && trimmed.includes('TZID')) {
      const match = trimmed.match(/DTSTART;TZID=.*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (match) {
        event.start = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`;
      }
    }
    if (trimmed.startsWith('DTEND') && trimmed.includes('TZID')) {
      const match = trimmed.match(/DTEND;TZID=.*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (match) {
        event.end = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00`;
      }
    }
    if (trimmed.startsWith('SUMMARY:')) {
      const val = trimmed.replace('SUMMARY:', '').trim();
      event.title = val;
      event.description = val;
    }
    if (trimmed.startsWith('LOCATION:')) {
      event.location = trimmed.replace('LOCATION:', '').trim();
    }

    if (trimmed === 'END:VEVENT') {
      if (event.start && event.title) {
        events.push(event);
      }
      event = {};
    }
  });

  if (events.length === 0) {
    throw new Error('No shifts parsed from Quinyx response');
  }

  // Sort by start date
  events.sort((a, b) => a.start.localeCompare(b.start));

  fs.writeFileSync('shifts.json', JSON.stringify(events, null, 2));
  console.log(`[${new Date().toISOString()}] Updated ${events.length} shifts`);

} catch (err) {
  console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`);
  process.exit(1);
}
