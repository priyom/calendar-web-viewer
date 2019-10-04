// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

// IE and Edge do not support scrollTo().
function scrollElement(el, y) {
  if (el.scrollTo) {
    el.scrollTo(0, y);
  } else {
    el.scrollTop = y;
  }
}

class Ui {
  constructor(container) {
    this.calendarBody = null;

    // The top bar with the static legend.
    let calendarTop = document.createElement('div');
    calendarTop.className = 'calendar-top';
    calendarTop.innerHTML = `
<div class="calendar-time">Time</div>
<div class="calendar-station"><abbr title="Station">Stn.</abbr></div>
<div class="calendar-frequency"><abbr title="Frequency">Freq.</abbr></div>
<div class="calendar-mode">Mode</div>
<div class="calendar-remarks">Remarks</div>
`;
    container.appendChild(calendarTop);

    // The main body containing the events.
    this.calendarBody = document.createElement('div');
    this.calendarBody.className = 'calendar-body';
    this.calendarBody.addEventListener('scroll', e => {
      // The scroll properties are rounded down due to fractional values on high DPI displays.
      // It's not perfect, though - it sometimes loads more than one day at once.
      if (Math.floor(e.target.scrollTop) === 0) {
        this.onScrollTop();
      } else if (Math.floor(e.target.scrollTop) === Math.floor(e.target.scrollHeight - e.target.offsetHeight)) {
        this.onScrollBottom();
      }
    });
    container.appendChild(this.calendarBody);

    // The bottom bar with the time zone.
    let calendarBottom = document.createElement('div');
    calendarBottom.className = 'calendar-bottom';
    calendarBottom.textContent = 'Time zone: UTC';
    container.appendChild(calendarBottom);
  }

  addDay(direction, date, events) {
    let day = document.createElement('div');
    day.className = 'calendar-day';

    let header = document.createElement('div');
    header.className = 'calendar-date';
    header.textContent = this._formatDate(date);
    day.appendChild(header);

    // Treat non-arrays as single-line text notices.
    if (Array.isArray(events)) {
      for (let i = 0; i < events.length; ++i) {
        day.appendChild(this._buildEvent(events[i]));
      }
    } else {
      let notice = document.createElement('div');
      notice.className = 'calendar-event';
      notice.textContent = events;
      day.appendChild(notice);
    }

    this.calendarBody.insertBefore(day, direction === 'earlier' ? this.calendarBody.firstChild : null);

    // When prepending a day, make sure that the browser doesn't suddenly scroll to the top of the container.
    if (direction === 'earlier') {
      scrollElement(this.calendarBody, day.offsetHeight);
    }
  }

  onScrollTop() {
    // Does nothing by default. Use for hooks to load more past events.
  }

  onScrollBottom() {
    // Does nothing by default. Use for hooks to load more future events.
  }

  // ---------------------------------------------------------------------------

  _buildEvent(ev) {
    let time = document.createElement('div');
    time.className = 'calendar-time';
    time.textContent = this._formatTime(ev.start);

    let station = document.createElement('div');
    station.className = 'calendar-station';
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

    let mode = document.createElement('div');
    mode.className = 'calendar-mode';
    mode.textContent = ev.mode;

    let remarks = document.createElement('div');
    remarks.className = 'calendar-remarks';
    remarks.textContent = ev.remarks;

    let section = document.createElement('div');
    section.className = 'calendar-event';
    section.appendChild(time);
    section.appendChild(station);
    section.appendChild(frequency);
    section.appendChild(mode);
    section.appendChild(remarks);
    return section;
  }

  _formatDate(date) {
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return DAYS_OF_WEEK[date.getUTCDay()] + ', ' + date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()];
  }

  _formatTime(date) {
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    return (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes);
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
    }
    let url = 'http://priyom.org/number-stations' + MIDDLE[station[0]] + station.toLowerCase();
    if ((station[0] === 'F' || station[0] === 'P') && station[1] === '0' && station[2] === '3') {
      // Accommodate for the ever growing number of F03/P03 variants.
      return url.slice(0, -1);
    }
    return url;
  }
}

class CalendarViewer {
  constructor(container, source) {
    this.ui = new Ui(container);
    this.source = source;
    this.load = {
      earlier: true,
      later: true
    };
    this.dates = { // The earliest and the latest date loaded so far.
      earlier: null,
      later: null
    };

    this.dates.earlier = this.dates.later = new Date();
    this._loadEvents('later', this.dates.later, () => scrollElement(this.ui.calendarBody, 31)); // HACK: Compensate for .calendar-day:first-child in the CSS.
    this.ui.onScrollTop = () => this._loadEvents('earlier');
    this.ui.onScrollBottom = () => this._loadEvents('later');
  }

  // ---------------------------------------------------------------------------

  _loadEvents(direction, date, cb) {
    if (!this.load[direction]) {
      return;
    }
    let newDate = date;
    if (!date) {
      newDate = new Date(this.dates[direction]);
      newDate.setUTCDate(newDate.getUTCDate() + (direction === 'earlier' ? -1 : 1));
    }
    this.source.listEvents(newDate)
      .then(events => {
        if (events.length === 0) {
          this.ui.addDay(direction, newDate, 'No more events available');
          this.load[direction] = false;
          return;
        }
        this.ui.addDay(direction, newDate, events);
        this.dates[direction] = newDate;
        if (cb) {
          cb();
        }
      })
      .catch(err => {
        this.ui.addDay(direction, newDate, 'Cannot load events: ' + err.message);
        this.load.earlier = this.load.later = false;
      });
  }
}

export default CalendarViewer;
