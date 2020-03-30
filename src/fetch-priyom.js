// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019, 2020 Daniel Ekmann

// Asynchronously fetches and parses events from the Priyom calendar server.
//
// Parameters:
// - date: a Date object representing the UTC date to fetch events for; the time
//         properties are ignored, and 00:00-24:00 UTC is assumed instead
// - cb: a callback Function that takes one argument: an Error object in case of
//       failure; or an Array of event objects in case of success
//
// Each event object adheres to the following structure:
//
// {
//   start: Date,                    // The timestamp at which this event begins.
//   station: String,                // The station name.
//   frequencies: Array | undefined, // Array of frequencies in kilohertz.
//   mode: String | undefined,       // The reception mode(s).
//   remarks: String                 // Human-readable remarks.
// }
function fetchPriyom(date, cb) {
  let timeMin = new Date(date);
  timeMin.setUTCHours(0, 0, 0, 0);
  let timeMax = new Date(timeMin);
  timeMax.setUTCDate(timeMax.getUTCDate() + 1);
  let xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status !== 200) {
      cb(new Error('Status code ' + xhr.status));
      return;
    }
    try {
      cb(JSON.parse(xhr.responseText).items.map(obj => {
        let matches = obj.summary.match(/^(\w+) (Search|([0-9].*kHz) ([A-Z/]+)) ?(.*)/);
        return {
          start: new Date(obj.start.dateTime),
          station: matches[1],
          frequencies: matches[2] === 'Search' ? undefined : matches[3].split(', ').map(s => parseInt(s, 10)),
          mode: matches[4],
          remarks: matches[5]
        };
      }));
    } catch (e) {
      cb(e);
    }
  };
  xhr.onerror = () => {
    cb(new Error('Network request failed'));
  };
  xhr.open('GET', `http://calendar.priyom.org/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`);
  xhr.send(null);
}

export default fetchPriyom;
