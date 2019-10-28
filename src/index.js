// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

import 'es6-promise/auto';
import 'whatwg-fetch';

import './style.css';
import createClock from './clock.js';
import createViewer from './viewer.js';

window.createClock = createClock;
window.createViewer = createViewer;
