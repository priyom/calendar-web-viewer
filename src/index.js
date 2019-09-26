// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

import 'es6-promise/auto';
import 'whatwg-fetch';
import './style.css';
import GoogleCalendarSource from './google-calendar-source.js';
import CalendarViewer from './viewer.js';

window.GoogleCalendarSource = GoogleCalendarSource;
window.CalendarViewer = CalendarViewer;
