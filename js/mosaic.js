'use strict';


var TILE_WIDTH = 16;
var TILE_HEIGHT = 16;


var Mosaic = function(image, container) {

  var imageData = Mosaic.getDataFromImage(image);

  var renderer = new Mosaic.Renderer(imageData, container);

  // Step through the image data, one row of tiles at a time
  var itemsPerPixel = 4;
  var itemsPerRow = itemsPerPixel * imageData.width;
  var incrementBy = itemsPerRow * TILE_HEIGHT;

  for (var index = 0; index < imageData.data.length; index += incrementBy) {
    renderer.addRow(Mosaic.getAverageColorsForRow(imageData, index));
  }

};


Mosaic.Renderer = function(imageData, container) {

  var mosaicWorker;

  var mosaic = document.createElement('div');

  // Add the mosaic at the beginning of the container.
  if (container.firstChild) {
    container.insertBefore(mosaic, container.firstChild);
  } else {
    container.appendChild(mosaic);
  }

  // Make the mosaic at least as wide as the image (and a multiple of the image tile width).
  mosaic.style.width = Math.ceil(imageData.width / TILE_WIDTH) * TILE_WIDTH + 'px';
  
  // Create an array to store the HTML for each row.
  var rows = new Array(Math.ceil(imageData.height / TILE_HEIGHT));
  var nextLoadRowIndex = 0;
  var nextRenderRowIndex = 0;

  // Draw the available mosaic tiles, one row at a time, starting at the top (or after the last rendered row).
  function render() {
    for (var index = nextRenderRowIndex; index < rows.length; index++) {
      if (!rows[index]) break;
      mosaic.insertAdjacentHTML('beforeend', rows[index]);
      nextRenderRowIndex++;
    }

    if (queue.length > 0) {
      dequeueRow();

    } else if (nextRenderRowIndex >= rows.length) {
      mosaicWorker.terminate();
      mosaicWorker = undefined;
    }
  }

  // Add a single row of tiles, based on an array of colors.
  function addRow(colors) {

    var thisRowIndex = nextLoadRowIndex;

    if (!mosaicWorker) mosaicWorker = new Worker("js/mosaic-worker.js");

    mosaicWorker.addEventListener('message', function(e) {

      // If the message is for this row
      if (e.data[0] === thisRowIndex) {

        var html = e.data[1];

        rows[thisRowIndex] = html;
        render();
      }

    });

    // Ask the worker to load tiles for this row
    mosaicWorker.postMessage([thisRowIndex, colors]);

    nextLoadRowIndex++;
  }

  // Get the next set of colors from the queue and pass them to “addRow”
  function dequeueRow() {
    if (queue.length <= 0) return;

    var activeRows = nextLoadRowIndex - nextRenderRowIndex;
    var activeRequests = queue[0].length * activeRows;

    var maxNodeServerConnections = 1000; // http://stackoverflow.com/questions/17033631/node-js-maxing-out-at-1000-concurrent-connections

    if (activeRequests < maxNodeServerConnections) {
      var colors = queue.shift();
      addRow(colors);
    }
  }

  var queue = [];
  function queueRow(colors) {
    queue.push(colors);
    dequeueRow();
  }

  return {
    addRow: queueRow // Queue the requests for new rows, to avoid sending too many AJAX requests at once.
  };
};


// Get the average colors for one row of the mosaic, as an array.
// For example…
// [
//   [r, g, b, a],
//   [r, g, b, a],
//   ...
// ]
Mosaic.getAverageColorsForRow = function(imageData, startIndex) {
  var colors = [];
  for (var i = startIndex; i < startIndex + (imageData.width * 4); i += 4 * TILE_WIDTH) {
    var average = Mosaic.getAverageColorForTile(imageData, i);
    colors.push(average);
  }
  return colors;
};


// Get the average color of a single tile, as an array (r, g, b, a)
Mosaic.getAverageColorForTile = function(imageData, startIndex) {
  var r = 0, g = 0, b = 0, a = 0;

  var count = 0;

  for (var i = startIndex; ((i < startIndex + (imageData.width * 4 * TILE_HEIGHT)) && (i < imageData.data.length)); i += 4 * imageData.width) {
    for (var j = i; ((j < i + (TILE_WIDTH * 4)) && (j < imageData.data.length)); j += 4) {
      r += imageData.data[j];
      g += imageData.data[j + 1];
      b += imageData.data[j + 2];
      a += imageData.data[j + 3];
      count++;
    }
  }

  return [Math.floor(r/count), Math.floor(g/count), Math.floor(b/count), Math.floor(a/count)];
};


// Get an array of numbers that represent rgba values for each pixel in the image.
// Here’s what the data for a 2x2 image might look like, for example…
// [
//   215, 243, 189, 255,
//   156, 212, 150, 255,
//    89,  90, 122, 255,
//   100, 243, 150, 255
// ]
Mosaic.getDataFromImage = function(image) {

  var canvas = document.createElement('canvas');

  canvas.setAttribute('width', image.naturalWidth);
  canvas.setAttribute('height', image.naturalHeight);

  // Hide the canvas
  canvas.setAttribute('style', 'position: absolute; z-index: -1; visibility: hidden;');

  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);

  var imageData = ctx.getImageData(0, 0, canvas.offsetWidth, canvas.offsetHeight);

  canvas.parentNode.removeChild(canvas);

  return imageData;
};

