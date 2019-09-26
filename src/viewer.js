// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

// Less than ideal, but it works.
const isMicrosoft = /Trident/.test(navigator.userAgent) || /Edge/.test(navigator.userAgent);

class Ui {
  constructor(container) {
    this.container = container;
    this.calendarBody = null;

    // The top bar with the static legend.
    let calendarTop = document.createElement('div');
    calendarTop.className = 'calendar-top';

    let topTime = document.createElement('div');
    topTime.className = 'calendar-time';
    topTime.textContent = 'Time';
    calendarTop.appendChild(topTime);

    let topStation = document.createElement('div');
    topStation.className = 'calendar-station';
    let topStationAbbr = document.createElement('abbr');
    topStationAbbr.title = 'Station';
    topStationAbbr.textContent = 'Stn.';
    topStation.appendChild(topStationAbbr);
    calendarTop.appendChild(topStation);

    let topFrequency = document.createElement('div');
    topFrequency.className = 'calendar-frequency';
    let topFrequencyAbbr = document.createElement('abbr');
    topFrequencyAbbr.title = 'Frequency';
    topFrequencyAbbr.textContent = 'Freq.';
    topFrequency.appendChild(topFrequencyAbbr);
    calendarTop.appendChild(topFrequency);

    let topMode = document.createElement('div');
    topMode.className = 'calendar-mode';
    topMode.textContent = 'Mode';
    calendarTop.appendChild(topMode);

    let topRemarks = document.createElement('div');
    topRemarks.className = 'calendar-remarks';
    topRemarks.textContent = 'Remarks';
    calendarTop.appendChild(topRemarks);

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

    // The bottom bar with the time zone.
    let calendarBottom = document.createElement('div');
    calendarBottom.className = 'calendar-bottom';
    calendarBottom.textContent = 'Time zone: UTC';

    // Construct.
    this.container.appendChild(calendarTop);
    this.container.appendChild(this.calendarBody);
    this.container.appendChild(calendarBottom);
  }

  addEvents(position, date, events) {
    let day = document.createElement('div');
    day.className = 'calendar-day';
    day.appendChild(this._buildDate(date));
    for (let i = 0; i < events.length; ++i) {
      day.appendChild(this._buildEvent(events[i]));
    }
    this.calendarBody.insertBefore(day, position === 'top' ? this.calendarBody.firstChild : null);
    if (position === 'top') {
      // Keep the scroll at the date previously loaded.
      if (!isMicrosoft) {
        this.calendarBody.scrollTo(0, day.offsetHeight);
      } else {
        this.calendarBody.scrollTop = day.offsetHeight;
      }
    }
  }

  addNotice(position, date, text) {
    let day = document.createElement('div');
    day.className = 'calendar-day';
    day.appendChild(this._buildDate(date));
    day.appendChild(this._buildNotice(text));
    this.calendarBody.insertBefore(day, position === 'top' ? this.calendarBody.firstChild : null);
  }

  onScrollTop() {
    // Does nothing by default. Use for hooks to load more past events.
  }

  onScrollBottom() {
    // Does nothing by default. Use for hooks to load more future events.
  }

  // ---------------------------------------------------------------------------

  _buildDate(date) {
    let section = document.createElement('div');
    section.className = 'calendar-date';
    section.textContent = this._formatDate(date);
    return section;
  }

  _buildNotice(text) {
    let section = document.createElement('div');
    section.className = 'calendar-event';
    section.textContent = text;
    return section;
  }

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
    if (station[0] === 'E' || station[0] === 'G' || station[0] === 'S' || station[0] === 'V') {
      return 'calendar-voice';
    }
    if (station[0] === 'M') {
      return 'calendar-morse';
    }
    if (station[0] === 'F' || station[0] === 'P' || (station[0] === 'X' && station[1] === 'P') || (station[0] === 'H' && station[1] === 'M')) {
      return 'calendar-digital';
    }
    return '';
  }

  _websiteUrlForStation(station) {
    let url = 'http://priyom.org/number-stations';

    if (station[0] === 'E') {
      url += '/english/';
    } else if (station[0] === 'G') {
      url += '/german/';
    } else if (station[0] === 'S') {
      url += '/slavic/';
    } else if (station[0] === 'V') {
      url += '/other/';
    } else if (station[0] === 'M') {
      url += '/morse/';
    } else if (station[0] === 'F' || station[0] === 'P' || (station[0] === 'X' && station[1] === 'P') || (station[0] === 'H' && station[1] === 'M')) {
      url += '/digital/';
    }

    url += station.toLowerCase();

    if ((station[0] === 'F' || station[0] === 'P') && station[1] === '0' && station[2] === '3') {
      return url.slice(0, -1);
    }

    return url;
  }
}

class CalendarViewer {
  constructor(container, source) {
    this.ui = new Ui(container);
    this.source = source;
    this.earliestDate = null;
    this.latestDate = null;
    this.loadEarlier = true;
    this.loadLater = true;

    // Pull in today's date.
    this.earliestDate = this.latestDate = new Date();
    this.source.listEvents(this.latestDate).then(events => {
      this.ui.addEvents('bottom', this.latestDate, events);

      // HACK: Compensate for .calendar-day:first-child in the CSS.
      if (!isMicrosoft) {
        this.ui.calendarBody.scrollTo(0, 31);
      } else {
        this.ui.calendarBody.scrollTop = 31;
      }
    }).catch(err => {
      this.ui.addNotice('bottom', this.latestDate, 'Cannot load events: ' + err.message);
      this.loadEarlier = false;
      this.loadLater = false;
    });

    // When scrolled all the way to the top, load the previous date.
    this.ui.onScrollTop = () => {
      if (!this.loadEarlier) {
        return;
      }

      let prevDate = new Date(this.earliestDate);
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      this.source.listEvents(prevDate).then(events => {
        if (events.length === 0) {
          this.ui.addNotice('top', prevDate, 'No more events available');
          this.loadEarlier = false;
          return;
        }
        this.ui.addEvents('top', prevDate, events);
        this.earliestDate = prevDate;
      }).catch(err => {
        this.ui.addNotice('top', prevDate, 'Cannot load events: ' + err.message);
        this.loadEarlier = false;
        this.loadLater = false;
      });
    };

    // When scrolled all the way to the bottom, load the next date.
    this.ui.onScrollBottom = () => {
      if (!this.loadLater) {
        return;
      }

      let nextDate = new Date(this.latestDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      this.source.listEvents(nextDate).then(events => {
        if (events.length === 0) {
          this.ui.addNotice('bottom', nextDate, 'No more events available');
          this.loadLater = false;
          return;
        }
        this.ui.addEvents('bottom', nextDate, events);
        this.latestDate = nextDate;
      }).catch(err => {
        this.ui.addNotice('bottom', nextDate, 'Cannot load events: ' + err.message);
        this.loadEarlier = false;
        this.loadLater = false;
      });
    };
  }
}

export default CalendarViewer;
