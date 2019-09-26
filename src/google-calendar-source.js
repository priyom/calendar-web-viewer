// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

class GoogleCalendarSource {
  constructor(key, calendarId) {
    this.baseUrl = 'https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events?orderBy=startTime&singleEvents=true&fields=items(start%2Csummary)%2Csummary&key=' + key;
  }

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
    let searchMatches = obj.summary.match(/^(\w+) Search (.*)$/);
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
