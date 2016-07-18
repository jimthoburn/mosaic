'use strict';


var MosaicWorker = {};


// Listen for messages from client.js
self.addEventListener('message', function(e) {
  var index  = e.data[0];
  var colors = e.data[1];

  MosaicWorker.getRowHTML(colors, function(html) {
    postMessage([index, html]);
  });
}, false);


// “colors” is an array of rgba colors for row of the mosaic
MosaicWorker.getRowHTML = function(colors, callback) {
  var html = new Array(colors.length);
  var loaded = 0;
  for (var index = 0; index < colors.length; index++) {
    (function(index) {
      MosaicWorker.loadTile(colors[index], function(responseText) {
        html[index] = responseText;
        loaded++;
        if (loaded === html.length) {
          callback(html.join(''));
        }
      });
    })(index);
  }
};


MosaicWorker.loadTile = function(rgbaColor, callback) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === XMLHttpRequest.DONE) {
      if (request.status === 200) {
        callback(request.responseText);
      } else {
        console.error('Something went wrong while requesting an image tile.');
      }
    }

  }

  request.open('GET', '../color/' + MosaicWorker.rgbToHex(rgbaColor[0], rgbaColor[1], rgbaColor[2]));
  request.send();
};


// KUDOS: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#answer-5624139
MosaicWorker.componentToHex = function(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};
MosaicWorker.rgbToHex =function(r, g, b) {
  return MosaicWorker.componentToHex(r) + MosaicWorker.componentToHex(g) + MosaicWorker.componentToHex(b);
};
