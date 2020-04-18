// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019, 2020 Daniel Ekmann

import fetchPriyom from './fetch-priyom.js';
import viewerHelpHtml from './viewer-help.html';

// A helper function for creating a bunch of DOM elements.
function createElement(tagName, className, textContent, useInnerHTML) {
  let el = document.createElement(tagName);
  el.className = className;
  el[useInnerHTML ? 'innerHTML' : 'textContent'] = textContent || ''; // Prevent IE 11 and Edge <=18 from putting in "undefined" everywhere.
  return el;
}

// Formats the UTC date portion of the given Date object as it's meant to be displayed inside the viewer.
function formatDate(date) {
  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return DAYS_OF_WEEK[date.getUTCDay()] + ', ' + date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()];
}

// Formats the UTC time portion of the given Date object as it's meant to be displayed inside the viewer.
function formatTime(date) {
  let h = date.getUTCHours();
  let m = date.getUTCMinutes();
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

// Returns the name of the CSS class that would color the name of the given station according to its emission type.
function classNameForStation(station) {
  if (['E', 'G', 'S', 'V'].indexOf(station[0]) !== -1) {
    return 'calendar-voice';
  } else if (station[0] === 'M') {
    return 'calendar-morse';
  }
  return 'calendar-digital';
}

// Returns the URL of the Priyom website page about the given station.
function websiteUrlForStation(station) {
  if ((station[0] === 'F' || station[0] === 'P') && station[1] === '0' && station[2] === '3') {
    return 'http://priyom.org/number-stations/operators/polish-11/digital-modes';
  }
  const MIDDLE = {
    'E': '/english/',
    'G': '/german/',
    'S': '/slavic/',
    'V': '/other/',
    'M': '/morse/'
  };
  return 'http://priyom.org/number-stations' + (MIDDLE[station[0]] || '/digital/') + station.toLowerCase();
}

// Builds a DOM element representing a single event object. See fetch-priyom.js for details on event objects.
function buildEvent(event) {
  let el = createElement('div', 'calendar-event');
  el.appendChild(createElement('div', 'calendar-time', formatTime(event.start)));

  let station = el.appendChild(createElement('div', 'calendar-station'));
  let stationLink = station.appendChild(createElement('a', classNameForStation(event.station), event.station));
  stationLink.href = websiteUrlForStation(event.station);

  if (event.frequencies === undefined) {
    el.appendChild(createElement('div', 'calendar-frequency calendar-search', 'Search'));
  } else {
    el.appendChild(createElement('div', 'calendar-frequency', event.frequencies.map(f => f + 'kHz').join('<br>'), true));
  }

  el.appendChild(createElement('div', 'calendar-mode', event.mode));
  el.appendChild(createElement('div', 'calendar-remarks', event.remarks));
  return el;
}

// Builds a DOM element representing an array of event objects and their dates.
function buildEvents(events) {
  // Handle fetchPriyom() errors.
  if (events instanceof Error) {
    return createElement('div', 'calendar-event', 'Cannot load events: ' + events.message);
  } else if (events.length === 0) {
    return createElement('div', 'calendar-event', 'No more events available');
  }

  let el = createElement('div', 'calendar-day');
  for (let i = 0; i < events.length; ++i) {
    // Add the date at the beginning and between the events with different dates.
    if (i === 0 || events[i - 1].start.toISOString().substring(0, 10) !== events[i].start.toISOString().substring(0, 10)) {
      el.appendChild(createElement('div', 'calendar-date', formatDate(events[i].start)));
    }
    el.appendChild(buildEvent(events[i]));
  }

  return el;
}

class Viewer {
  constructor(parent) {
    this.body = null;
    this.earliestDate = this.latestDate = new Date();
    this.scrollEarlier = this.scrollLater = true;

    // The top bar with the static legend.
    let legend = parent.appendChild(createElement('div', 'calendar-top'));
    [
      createElement('div', 'calendar-time', 'Time'),
      createElement('div', 'calendar-station', '<abbr title="Station">Stn.</abbr>', true),
      createElement('div', 'calendar-frequency', '<abbr title="Frequency">Freq.</abbr>', true),
      createElement('div', 'calendar-mode', 'Mode'),
      createElement('div', 'calendar-remarks', 'Remarks')
    ].forEach(el => legend.appendChild(el));

    // The main body containing the events.
    this.body = parent.appendChild(createElement('div', 'calendar-body'));
    this.body.addEventListener('scroll', () => {
      if (this.scrollEarlier && this.body.scrollTop < 1) {
        this.scrollEarlier = false; // Prevent duplicate requests, particularly on high DPI displays.
        fetchPriyom(this.earliestDate.getTime() - 86400000, events => {
          this.prepend(events);
          this.scrollEarlier = events.length > 0;
        });
      } else if (this.scrollLater && this.body.scrollHeight - this.body.scrollTop - this.body.offsetHeight < 1) {
        this.scrollLater = false;
        fetchPriyom(this.latestDate.getTime() + 86400000, events => {
          this.append(events);
          this.scrollLater = events.length > 0;
        });
      }
    });

    // The overlay with the static help text. (hidden by default)
    let help = parent.appendChild(createElement('div', 'calendar-help', viewerHelpHtml, true));

    // The bottom bar with the time zone and the help facility.
    let bottom = parent.appendChild(createElement('div', 'calendar-bottom'));
    bottom.appendChild(createElement('div', 'calendar-time-zone', 'Time zone: UTC'));
    let helpLink = bottom.appendChild(createElement('a', 'calendar-help-link', 'Help'));
    helpLink.href = '#';
    helpLink.addEventListener('click', e => {
      e.preventDefault();
      help.style.display = help.style.display === 'block' ? 'none' : 'block';
      helpLink.textContent = helpLink.textContent === 'Close' ? 'Help' : 'Close';
    });
  }

  prepend(events) {
    let day = buildEvents(events);
    this.body.insertBefore(day, this.body.firstChild);
    this.body.scrollTop = day.offsetHeight; // Keep the scrollbar where the top of the body previously was.
    if (events.length > 0) {
      this.earliestDate = events[0].start;
    }
  }

  append(events) {
    this.body.appendChild(buildEvents(events));
    if (this.body.childNodes.length === 1) {
      this.body.scrollTop = 32; // A hacky way to enable backwards scrolling without first scrolling forward.
    }
    if (events.length > 0) {
      this.latestDate = events[events.length - 1].start;
    }
  }
}

export default Viewer;
