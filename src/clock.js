// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright 2019 Daniel Ekmann

class UtcClock {
  constructor(container) {
    let title = document.createElement('h3');
    title.textContent = 'UTC time';
    container.appendChild(title);

    let content = document.createElement('div');
    container.appendChild(content);

    // setInterval():
    // 1. cannot take a method as it binds "this" improperly.
    // 2. does not execute until after the first interval completes.
    let doTime = () => {
      let date = new Date();
      content.textContent = (date.getUTCHours() < 10 ? '0' + date.getUTCHours() : date.getUTCHours()) + ':' + (date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes()) + ':' + (date.getUTCSeconds() < 10 ? '0' + date.getUTCSeconds() : date.getUTCSeconds());
    };
    doTime();
    setInterval(doTime, 1000);
  }
}

export default UtcClock;
