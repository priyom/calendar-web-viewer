// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

//
// A data source that relies on the in-house Priyom calendar system.
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
class PriyomSource {
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
    return fetch(`http://calendar.priyom.org/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`)
      .then(response => {
        if (response.status !== 200) {
          throw new Error('Status code ' + response.status);
        }
        return response.json();
      })
      .then(data => data.items.map(this._parseEvent));
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

export default PriyomSource;
