function TTY(screenElement, keyboardElement) {

    this.TEXT_STYLE_NORMAL = 0;
    this.TEXT_STYLE_INVERSE = 1;
    this.TEXT_STYLE_FLASH = 2;

    var self = this,
  
        cursorX = 0,
        cursorY = 0,
        cursorVisible = false,
        cursorElement = null,
        styleElem,
        screenGrid,
        screenRow = [],
        splitPos = 0,
        screenWidth,
        screenHeight,
        curStyle = this.TEXT_STYLE_NORMAL,
        cursorState = true,
        cursorInterval,
        firmwareActive = true, 
        mousetext = false,

        lineCallback,
        charCallback,
        inputBuffer = [],
        keyboardRegister = 0,
        keyDown = false,
        capsLock = true, 
        buttonState = [0, 0, 0, 0];
  
    this.autoScroll = true;
  
    function setCellByte(x, y, byte) {
      var cell = screenGrid[x + screenWidth * y];
      if (cell && cell.byte !== byte) {
        cell.byte = byte;
        cell.elem.className = 'jsb-chr jsb-chr' + String(byte);
      }
    }
  
    function setCellChar(x, y, c) {
      var byte;
  
      if (c > 0xff) {

        byte = c;
      } else {

        c = (c >>> 0) & 0x7f;
  
        if (firmwareActive) {
          if (curStyle === self.TEXT_STYLE_INVERSE) {
            if (0x20 <= c && c < 0x40) { byte = c; }
            else if (0x40 <= c && c < 0x60) { byte = c - (mousetext ? 0 : 0x40); }
            else if (0x60 <= c && c < 0x80) { byte = c; }
          } else if (curStyle === self.TEXT_STYLE_FLASH) {
            if (0x20 <= c && c < 0x40) { byte = c + 0x40; }
            else if (0x40 <= c && c < 0x60) { byte = c - 0x40; }
            else if (0x60 <= c && c < 0x80) { byte = c; }
          } else {
            if (0x20 <= c && c < 0x40) { byte = c + 0x80; }
            else if (0x40 <= c && c < 0x60) { byte = c + 0x80; }
            else if (0x60 <= c && c < 0x80) { byte = c + 0x80; }
          }
        } else {
          if (curStyle === self.TEXT_STYLE_INVERSE) {
            if (0x20 <= c && c < 0x40) { byte = c; }
            else if (0x40 <= c && c < 0x60) { byte = c - 0x40; }
            else if (0x60 <= c && c < 0x80) { byte = c - 0x40; } 
          } else if (curStyle === self.TEXT_STYLE_FLASH) {
            if (0x20 <= c && c < 0x40) { byte = c + 0x40; }
            else if (0x40 <= c && c < 0x60) { byte = c; }
            else if (0x60 <= c && c < 0x80) { byte = c; } 
          } else {
            if (0x20 <= c && c < 0x40) { byte = c + 0x80; }
            else if (0x40 <= c && c < 0x60) { byte = c + 0x80; }
            else if (0x60 <= c && c < 0x80) { byte = c + 0x80; }
          }
        }
      }
      setCellByte(x, y, byte);
    }
  
    this.reset = function reset() {
      this.hideCursor();
      lineCallback = undefined;
      charCallback = undefined;
  
      inputBuffer = [];
      keyboardRegister = 0;
      buttonState = [0, 0, 0, 0];
  
    }; 
  
    function init(active, rows, columns) {
      firmwareActive = active;
      screenWidth = columns;
      screenHeight = rows;
  
      self.textWindow = {};
      self.textWindow.left = 0;
      self.textWindow.top = 0;
      self.textWindow.width = screenWidth;
      self.textWindow.height = screenHeight;
      self.setTextStyle(self.TEXT_STYLE_NORMAL);
  
      var x, y, table, tbody, tr, td;
      screenGrid = [];
      screenGrid.length = screenWidth * screenHeight;
  
      table = document.createElement('table');
      tbody = document.createElement('tbody');
      styleElem = tbody;
  
      styleElem.classList.add(screenWidth === 40 ? 'jsb-40col' : 'jsb-80col');
      if (firmwareActive) { styleElem.classList.add('jsb-active'); }
  
      for (y = 0; y < screenHeight; y += 1) {
        tr = document.createElement('tr');
        tr.style.visibility = (y < splitPos) ? "hidden" : "";
        screenRow[y] = tr;
  
        for (x = 0; x < screenWidth; x += 1) {
          td = document.createElement('td');
          screenGrid[screenWidth * y + x] = {
            elem: td
          };
          tr.appendChild(td);
        }
  
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      screenElement.innerHTML = "";
      screenElement.appendChild(table);
  
      self.clearScreen();
  
      cursorElement = document.createElement('span');
      cursorElement.className = 'jsb-chr jsb-chr-cursor jsb-chr255';
      self.setCursorPosition(0, 0);
    }
  
    this.clearScreen = function clearScreen() {
      var x, y;
      cursorX = self.textWindow.left;
      cursorY = self.textWindow.top;
      for (y = self.textWindow.top; y < self.textWindow.top + self.textWindow.height; y += 1) {
        for (x = self.textWindow.left; x < self.textWindow.left + self.textWindow.width; x += 1) {
          setCellChar(x, y, 0x20);
        }
      }
    };