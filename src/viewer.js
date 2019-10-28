// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

import PriyomSource from './priyom-source.js';
import topHtml from './viewer-top.html';
import helpHtml from './viewer-help.html';

// IE and Edge do not support scrollTo().
function scrollElement(el, y) {
  if (el.scrollTo) {
    el.scrollTo(0, y);
  } else {
    el.scrollTop = y;
  }
}

class Viewer {
  constructor(parent) {
    this.body = null;
    this.hooks = {};

    // Used to position the help overlay.
    parent.style.position = 'relative';

    // The top bar with the static legend.
    let legend = document.createElement('div');
    legend.className = 'calendar-top';
    legend.innerHTML = topHtml;
    parent.appendChild(legend);

    // The main body containing the events.
    this.body = document.createElement('div');
    this.body.className = 'calendar-body';
    parent.appendChild(this.body);

    // The overlay with the static help text. (hidden by default)
    let help = document.createElement('div');
    help.className = 'calendar-help';
    help.innerHTML = helpHtml;
    parent.appendChild(help);

    // The bottom bar with the time zone and the help facility.
    let bottom = document.createElement('div');
    bottom.className = 'calendar-bottom';
    parent.appendChild(bottom);

    let timeZone = document.createElement('div');
    timeZone.className = 'calendar-time-zone';
    timeZone.textContent = 'Time zone: UTC';
    bottom.appendChild(timeZone);

    let helpLink = document.createElement('a');
    helpLink.className = 'calendar-help-link';
    helpLink.href = '#';
    helpLink.textContent = 'Help';
    bottom.appendChild(helpLink);

    // Detect when the body is scrolled all the way to the top or the bottom, and call the relevant hooks.
    this.body.addEventListener('scroll', e => {
      // The scroll properties are rounded down due to fractional values on high DPI displays.
      // However, this sometimes loads more than one day at once on such displays. Any ideas?
      if (Math.floor(e.target.scrollTop) === 0) {
        this.hooks.scrollTop();
      } else if (Math.floor(e.target.scrollTop) === Math.floor(e.target.scrollHeight - e.target.offsetHeight)) {
        this.hooks.scrollBottom();
      }
    });

    // Display the help text when requested.
    helpLink.addEventListener('click', e => {
      e.preventDefault();
      if (!help.style.display || help.style.display === 'none') {
        help.style.display = 'block';
        e.target.textContent = 'Close';
      } else {
        help.style.display = 'none';
        e.target.textContent = 'Help';
      }
    });
  }

  prepend(events) {
    let day = this._buildDay(events);
    this.body.insertBefore(day, this.body.firstChild);
    scrollElement(this.body, day.offsetHeight); // Keep the scrollbar where the top of the body previously was.
  }

  append(events) {
    this.body.appendChild(this._buildDay(events));
    if (this.body.childNodes.length === 1) {
      scrollElement(this.body, 31); // A hacky way to enable backwards scrolling without first scrolling forward.
    }
  }

  on(name, cb) {
    this.hooks[name] = cb; // EventEmitter-style event hooks.
  }

  // ---------------------------------------------------------------------------

  _buildDay(events) {
    // Special cases where a single-line text notice is apt.
    if (!Array.isArray(events) || events.length === 0) {
      let notice = document.createElement('div');
      notice.className = 'calendar-event';
      if (events.length === 0) {
        notice.textContent = 'No more events available';
      } else if (events instanceof Error) {
        notice.textContent = 'Cannot load events: ' + events.message;
      }
      return notice;
    }

    let day = document.createElement('div');
    day.className = 'calendar-day';

    let header = document.createElement('div');
    header.className = 'calendar-date';
    header.textContent = this._formatDate(events[0].start); // A generous assumption that there is only one date in the set.
    day.appendChild(header);

    for (let i = 0; i < events.length; ++i) {
      day.appendChild(this._buildEvent(events[i]));
    }

    return day;
  }

  _buildEvent(ev) {
    let event = document.createElement('div');
    event.className = 'calendar-event';

    let time = document.createElement('div');
    time.className = 'calendar-time';
    time.textContent = this._formatTime(ev.start);
    event.appendChild(time);

    let station = document.createElement('div');
    station.className = 'calendar-station';
    event.appendChild(station);

    let stationLink = document.createElement('a');
    stationLink.className = this._classNameForStation(ev.station);
    stationLink.href = this._websiteUrlForStation(ev.station);
    stationLink.textContent = ev.station;
    station.appendChild(stationLink);

    let frequency = document.createElement('div');
    frequency.className = 'calendar-frequency';
    if (ev.frequencies === undefined) {
      frequency.className += ' calendar-search';
      frequency.textContent = 'Search';
    } else {
      frequency.innerHTML = ev.frequencies.map(f => f + 'kHz').join('<br>');
    }
    event.appendChild(frequency);

    let mode = document.createElement('div');
    mode.className = 'calendar-mode';
    mode.textContent = ev.mode;
    event.appendChild(mode);

    let remarks = document.createElement('div');
    remarks.className = 'calendar-remarks';
    remarks.textContent = ev.remarks;
    event.appendChild(remarks);

    return event;
  }

  _formatDate(date) {
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return DAYS_OF_WEEK[date.getUTCDay()] + ', ' + date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()];
  }

  _formatTime(date) {
    let h = date.getUTCHours();
    let m = date.getUTCMinutes();
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  }

  _classNameForStation(station) {
    const CLASSES = {
      'E': 'voice',
      'G': 'voice',
      'S': 'voice',
      'V': 'voice',
      'M': 'morse',
      'F': 'digital',
      'P': 'digital',
      'X': 'digital',
      'H': 'digital'
    };
    return 'calendar-' + CLASSES[station[0]];
  }

  _websiteUrlForStation(station) {
    const MIDDLE = {
      'E': '/english/',
      'G': '/german/',
      'S': '/slavic/',
      'V': '/other/',
      'M': '/morse/',
      'F': '/digital/',
      'P': '/digital/',
      'X': '/digital/',
      'H': '/digital/'
    };
    let url = 'http://priyom.org/number-stations' + MIDDLE[station[0]] + station.toLowerCase();
    if ((station[0] === 'F' || station[0] === 'P') && station[1] === '0' && station[2] === '3') {
      // Accommodate for the ever growing number of F03/P03 variants.
      return url.slice(0, -1);
    }
    return url;
  }
}

function createViewer(parent) {
  let viewer = new Viewer(parent);
  let source = new PriyomSource();

  let load = {
    earlier: true,
    later: true
  };
  let dates = {
    earlier: null,
    later: null
  };

  let loadEvents = dir => {
    if (dir instanceof Date) {
      dates.earlier = dates.later = dir;
      dir = 'later';
    } else {
      if (!load[dir]) {
        return;
      }
      dates[dir].setUTCDate(dates[dir].getUTCDate() + (dir === 'earlier' ? -1 : 1));
    }
    source.listEvents(dates[dir])
      .then(events => {
        viewer[dir === 'earlier' ? 'prepend' : 'append'](events);
        load[dir] = events.length > 0;
      })
      .catch(err => {
        viewer[dir === 'earlier' ? 'prepend' : 'append'](err);
        load.earlier = load.later = false;
      });
  };

  loadEvents(new Date());
  viewer.on('scrollTop', () => loadEvents('earlier'));
  viewer.on('scrollBottom', () => loadEvents('later'));
}

export default createViewer;
