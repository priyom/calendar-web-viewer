// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

import 'es6-promise/auto';
import 'whatwg-fetch';
import './style.css';
import CalendarViewer from './viewer.js';
import PriyomSource from './priyom-source.js';
import UtcClock from './clock.js';

window.CalendarViewer = CalendarViewer;
window.PriyomSource = PriyomSource;
window.UtcClock = UtcClock;
