# calendar-web-viewer

![A screenshot of the viewer in action](doc/screenshot.png)

The Priyom calendar frontend, comprising:

* A real-time UTC clock
* An event viewer
  * Supports infinite scrolling.
  * Colors the station names according to their emission types.
  * Links to the website pages about the stations.

## Getting started

Install [Node.js][]. Run `npm install && npx webpack` from the root directory to
compile the project. Embed the application on an HTML page as follows:

```html
<div id="clock-container"></div>
<div id="viewer-container"></div>
<script src="main.js"></script>
```

## License

The project is licensed under the GNU GPL version 3 or later.

[Node.js]: https://nodejs.org/en/
