// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

function createClock(parent) {
  let title = document.createElement('h3');
  title.textContent = 'UTC time';
  parent.appendChild(title);

  let content = document.createElement('div');
  parent.appendChild(content);

  let clock = () => {
    let date = new Date();
    let h = date.getUTCHours();
    let m = date.getUTCMinutes();
    let s = date.getUTCSeconds();
    content.textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  };
  clock(); // Set the clock immediately, not in 1000 ms.
  setInterval(clock, 1000);
}

export default createClock;
