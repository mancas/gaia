/* exported STKHelper */
'use strict';

/**
 * stk_helper.js: SIM Toolkit utilities.
 */

var STKHelper = {

  LIST_ICON_WIDTH: 30,
  LIST_ICON_HEIGHT: 30,

  getIconCanvas: function(mozStkIcon, width, height) {
    if (!mozStkIcon || !mozStkIcon.pixels ||
        !mozStkIcon.width || !mozStkIcon.height) {
      return null;
    }

    if (mozStkIcon.pixels.length < (mozStkIcon.width * mozStkIcon.height)) {
      console.error('Not enough pixels for the required dimension: ' +
        mozStkIcon.width + 'x' + mozStkIcon.height);
      return null;
    }

    if (!mozStkIcon.codingScheme) {
      mozStkIcon.codingScheme = 'basic';
    }

    var canvas = document.createElement('canvas');
    var canvasWidth = width ? width : mozStkIcon.width;
    var canvasHeight = height ? height : mozStkIcon.height;
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', canvasHeight);
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var imageData = ctx.createImageData(mozStkIcon.width, mozStkIcon.height);
    var pixel = 0, pos = 0;
    var data = imageData.data;
    for (var y = 0; y < mozStkIcon.height; y++) {
      for (var x = 0; x < mozStkIcon.width; x++) {
        data[pos++] = (mozStkIcon.pixels[pixel] & 0xFF000000) >>> 24; // Red
        data[pos++] = (mozStkIcon.pixels[pixel] & 0xFF0000) >>> 16;   // Green
        data[pos++] = (mozStkIcon.pixels[pixel] & 0xFF00) >>> 8;      // Blue
        data[pos++] = (mozStkIcon.pixels[pixel] & 0xFF);              // Alpha

        pixel++;
      }
    }

    var dx = width ? (width - mozStkIcon.width)/2 : 0;
    var dy = height ? (height - mozStkIcon.height)/2 : 0;
    ctx.putImageData(imageData, dx, dy);

    return canvas;
  }
};
