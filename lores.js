function LoRes(element, width, height) {

  var COLORS, 
      loresPixel = [], 
      pixels = [], 
      color = 0; 

  COLORS = [
    '#000000', 
    '#e31e60', 
    '#604ebd', 
    '#ff44fd', 
    '#00a360', 
    '#9c9c9c',
    '#14cffd', 
    '#d0c3ff', 
    '#607203', 
    '#ff6a3c',
    '#9c9c9c', 
    '#ffa0d0', 
    '#14f53c', 
    '#d0dd8d', 
    '#72ffd0', 
    '#ffffff'
  ];

  function init() {
    var x, y, table, tbody, tr, td;

    pixels = [];
    pixels.length = width * height;
    loresPixel = [];
    loresPixel.length = width * height;

    table = document.createElement('table');

    tbody = document.createElement('tbody');
    for (y = 0; y < height; y += 1) {
      tr = document.createElement('tr');
      for (x = 0; x < width; x += 1) {
        td = document.createElement('td');
        td.style.backgroundColor = 'black';

        loresPixel[y * width + x] = td;
        pixels[y * width + x] = 0;

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    element.innerHTML = "";
    element.appendChild(table);
  }

  this.clear = function() {
    var x, y, pixel;
    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        pixel = loresPixel[y * width + x];
        pixel.style.backgroundColor = "black";
        pixels[y * width + x] = 0;
      }
    }

  };

  this.setColor = function(newColor) {
    color = Math.floor(newColor) % COLORS.length;
  };

  function plot(x, y) {
    var pixel = loresPixel[y * width + x];
    if (pixel) {
      pixel.style.backgroundColor = COLORS[color];
      pixels[y * width + x] = color;
    }
  }

  this.plot = function(x, y) {
    plot(x, y);
  };

  this.getPixel = function(x, y) {
    if (0 <= x && x < width &&
            0 <= y && y < height) {

      return pixels[y * width + x];
    } else {
      return 0;
    }
  };

  this.hlin = function(x1, x2, y) {
    var x;
    if (x1 > x2) {
      x = x1;
      x1 = x2;
      x2 = x;
    }

    for (x = x1; x <= x2; x += 1) {
      plot(x, y);
    }
  };

  this.vlin = function(y1, y2, x) {
    var y;
    if (y1 > y2) {
      y = y1;
      y1 = y2;
      y2 = y;
    }

    for (y = y1; y <= y2; y += 1) {
      plot(x, y);
    }
  };

  this.getScreenSize = function() {
    return { width: width, height: height };
  };

  this.show = function(state) {
    element.style.visibility = state ? "visible" : "hidden";

  };

  init();
}