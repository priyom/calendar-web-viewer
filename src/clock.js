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
    // - cannot take a method as it binds "this" improperly.
    // - does not execute until after the first interval completes.
    let doTime = () => {
      let date = new Date();
      let hours = date.getUTCHours();
      let minutes = date.getUTCMinutes();
      let seconds = date.getUTCSeconds();
      content.textContent = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
    };
    doTime();
    setInterval(doTime, 1000);
  }
}

export default UtcClock;
