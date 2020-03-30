// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019, 2020 Daniel Ekmann

import './style.css';
import Clock from './clock.js';
import Viewer from './viewer.js';
import fetchPriyom from './fetch-priyom.js';

document.addEventListener('DOMContentLoaded', () => {
  let clock = new Clock(document.getElementById('clock-container'));
  let viewer = new Viewer(document.getElementById('viewer-container'));
  fetchPriyom(new Date(), events => viewer.append(events));
});
