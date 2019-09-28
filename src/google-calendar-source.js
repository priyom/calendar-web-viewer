// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

//
// A data source that relies on the legacy Google Calendar-based system.
//
// The only event properties used are the start timestamp and the summary.
// The summaries are expected to be formatted as follows:
//
// 1. A station name made solely of alphanumeric characters.
// 2. A single whitespace.
// 3a. If the frequencies are not known, the literal "Search" follows.
// 3b. Otherwise, the frequencies and the mode are formatted as follows:
//     1) A comma-and-space-separated list of radio frequencies in kilohertz.
//        Each entry is an integer followed by the literal "kHz".
//        Examples: "12345kHz", "1111kHz, 2222kHz, 3333kHz"
//     2) A single whitespace.
//     3) A slash-separated list of compatible receiver mode(s). Each entry is
//        made of uppercase letters only. Examples: "AM", "USB/AM", "RTTY/CW".
// 4. Optionally, a single whitespace followed by human-readable remarks.
//
// Examples of conformant summary strings:
//
// - "G06 Search"
// - "E07 Search [Last used: 16228kHz]"
// - "E11 7600kHz USB"
// - "E07 11464kHz USB (In case of traffic)"
// - "M01b 3520kHz, 4585kHz USB/AM"
// - "HM01 5855kHz, 9155kHz AM [Target: North America]"
//
// Events are parsed into JavaScript objects like the following:
//
// {
//   start: Date,                    // The timestamp at which this event begins.
//   station: String,                // The station name.
//   frequencies: Array | undefined, // Array of frequencies in kilohertz as numbers, e.g. [3520, 4585].
//   mode: String | undefined,       // The reception mode(s).
//   remarks: String                 // Human-readable remarks.
// }
//
class GoogleCalendarSource {
  constructor(key, calendarId) {
    this.baseUrl = 'https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events?orderBy=startTime&singleEvents=true&fields=items(start%2Csummary)%2Csummary&key=' + key;
  }

  //
  // Returns a Promise that resolves to an array of event objects covering
  // a single calendar date from 00:00 UTC (inclusive) to 24:00 UTC (exclusive),
  // sorted by start timestamp.
  //
  // "date" is expected to be a Date object; only the year, the month, and the
  // day properties are taken into consideration.
  //
  listEvents(date) {
    let timeMin = new Date(date);
    timeMin.setUTCHours(0, 0, 0, 0);

    let timeMax = new Date(timeMin);
    timeMax.setUTCDate(timeMax.getUTCDate() + 1);

    return fetch(this.baseUrl + '&timeMin=' + timeMin.toISOString() + '&timeMax=' + timeMax.toISOString()).then(response => {
      if (response.status !== 200) {
        throw new Error('Status code ' + response.status);
      }
      return response.json();
    }).then(data => data.items.map(this._parseEvent));
  }

  // ---------------------------------------------------------------------------

  _parseEvent(obj) {
    let searchMatches = obj.summary.match(/^(\w+) Search ?(.*)$/);
    if (searchMatches !== null) {
      return {
        start: new Date(obj.start.dateTime),
        station: searchMatches[1],
        remarks: searchMatches[2]
      };
    }

    let matches = obj.summary.match(/^(\w+) ([0-9].*kHz) ([A-Z/]+) ?(.*)/);
    return {
      start: new Date(obj.start.dateTime),
      station: matches[1],
      frequencies: matches[2].split(', ').map(s => Number(s.slice(0, -3))),
      mode: matches[3],
      remarks: matches[4]
    };
  }
}

export default GoogleCalendarSource;
