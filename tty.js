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

    this.clearEOL = function clearEOL() {
        var x;
        for (x = cursorX; x < self.textWindow.left + self.textWindow.width; x += 1) {
          setCellChar(x, cursorY, 0x20);
        }
      };
    
      this.clearEOS = function clearEOS() {
        var x, y;
        for (x = cursorX; x < self.textWindow.left + self.textWindow.width; x += 1) {
          setCellChar(x, cursorY, 0x20);
        }
        for (y = cursorY + 1; y < self.textWindow.top + self.textWindow.height; y += 1) {
          for (x = self.textWindow.left; x < self.textWindow.left + self.textWindow.width; x += 1) {
            setCellChar(x, y, 0x20);
          }
        }
      };
    
      this.setFirmwareActive = function setFirmwareActive(active) {
        if (active !== firmwareActive)
          init(active, 24, active ? 80 : 40);
      };
    
      this.isFirmwareActive = function isFirmwareActive() {
        return firmwareActive;
      };
    
      this.isAltCharset = function isAltCharset() {
        return mousetext;
      };
    
      function scrollUp() {
        var x, y, cell;
    
        for (y = self.textWindow.top; y < self.textWindow.top + self.textWindow.height - 1; y += 1) {
          for (x = self.textWindow.left; x < self.textWindow.left + self.textWindow.width; x += 1) {
    
            cell = screenGrid[x + screenWidth * (y + 1)];
            setCellByte(x, y, cell.byte);
          }
        }
    
        y = self.textWindow.top + (self.textWindow.height - 1);
        for (x = self.textWindow.left; x < self.textWindow.left + self.textWindow.width; x += 1) {
          setCellChar(x, y, 0x20);
        }
      }
    
      function scrollDown() {
        var x, y, cell;
    
        for (y = self.textWindow.top + self.textWindow.height - 1; y > self.textWindow.top; y -= 1) {
          for (x = self.textWindow.left; x < self.textWindow.left + self.textWindow.width; x += 1) {
    
            cell = screenGrid[x + screenWidth * (y - 1)];
            setCellByte(x, y, cell.byte);
          }
        }
    
        y = self.textWindow.top;
        for (x = self.textWindow.left; x < self.textWindow.left + self.textWindow.width; x += 1) {
          setCellChar(x, y, 0x20);
        }
      }
    
      this.scrollScreen = function scrollScreen() {
        scrollUp();
      };
    
      this.setTextStyle = function setTextStyle(style) {
        curStyle = style;
      };

  function updateCursor() {
    if (cursorVisible && cursorState) {
      var elem = screenGrid[cursorY * screenWidth + cursorX].elem;
      if (elem !== cursorElement.parentNode) {
        elem.appendChild(cursorElement);
      }
    } else if (cursorElement.parentNode) {
      cursorElement.parentNode.removeChild(cursorElement);
    }
  }

  this.cursorDown = function cursorDown() {
    cursorY += 1;
    if (cursorY >= self.textWindow.top + self.textWindow.height) {
      cursorY = self.textWindow.top + self.textWindow.height - 1;
      if (self.autoScroll) {
        self.scrollScreen();
      }
    }
    updateCursor();
  };

  this.cursorLeft = function cursorLeft() {
    cursorX -= 1;
    if (cursorX < self.textWindow.left) {
      cursorX += self.textWindow.width;
      cursorY -= 1;
      if (cursorY < self.textWindow.top) {
        cursorY = self.textWindow.top;
      }
    }
    updateCursor();
  };

  this.cursorUp = function cursorUp() {
    cursorY -= 1;
    if (cursorY < self.textWindow.top) {
      cursorY = self.textWindow.top;
    }
    updateCursor();
  };


  this.cursorRight = function cursorRight() {
    cursorX += 1;
    if (cursorX >= self.textWindow.left + self.textWindow.width) {
      cursorX = self.textWindow.left;
      self.cursorDown();
    }
    updateCursor();
  };

  this.writeChar = function writeChar(c) {
    var code = c.charCodeAt(0),
            x, y;

    switch (code) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4: 
      case 5:
      case 6:
      case 7:

        break;
        case 8: 
        self.cursorLeft();
        break;

      case 9:
        break;

      case 10: 
        self.cursorDown();
        break;

      case 11: 
        if (firmwareActive) {
          self.clearEOS();
        }
        break;

      case 12:
        if (firmwareActive) {

          self.clearScreen();
        }
        break;

      case 13: 
        cursorX = self.textWindow.left;
        self.cursorDown();
        break;

      case 14: 
        if (firmwareActive) {
          curStyle = self.TEXT_STYLE_NORMAL;
        }
        break;

      case 15: 
        if (firmwareActive) {
          curStyle = self.TEXT_STYLE_INVERSE;
        }
        break;

      case 16:
        break;

      case 17: 
        if (firmwareActive) {

          init(true, 24, 40);
        }
        break;

      case 18: 
        if (firmwareActive) {

          init(true, 24, 80);
        }
        break;

      case 19: 
      case 20:
        break;
        
      case 21:
      if (firmwareActive) {

        init(false, 24, 40);
      }
      break;

    case 22: 
      if (firmwareActive) {

        scrollDown();
      }
      break;

    case 23:
      if (firmwareActive) {

        scrollUp();
      }
      break;

    case 24: 
      if (firmwareActive) {

        mousetext = false;
      }
      break;

    case 25: 
      if (firmwareActive) {

        cursorX = self.textWindow.left;
        cursorY = self.textWindow.top;
      }
      break;

    case 26: 
      if (firmwareActive) {

        for (x = 0; x < self.textWindow.width; x += 1) {
          setCellChar(self.textWindow.left + x, cursorY, 0x20);
        }
      }
      break;

    case 27: 
      if (firmwareActive) {

        mousetext = true;
      }
      break;

    case 28: 
      if (firmwareActive) {

        cursorX += 1;
        if (cursorX > (self.textWindow.left + self.textWindow.width)) {
          cursorX -= self.textWindow.width;
          cursorY += 1;
          if (cursorY > self.textWindow.top + self.textWindow.height) {
            cursorY = self.textWindow.top + self.textWindow.height;
          }
        }
      }
      break;

    case 29: 
      if (firmwareActive) {

        self.clearEOL();
      }
      break;

    case 30: 
    case 31:
      break;

    default:
      setCellChar(cursorX, cursorY, code);
      self.cursorRight();
      break;
  }
};

this.writeString = function writeString(s) {
  var i;
  for (i = 0; i < s.length; i += 1) {
    this.writeChar(s.charAt(i));
  }
};

this.getScreenSize = function getScreenSize() {
  return { width: screenWidth, height: screenHeight };
};

this.getCursorPosition = function getCursorPosition() {
  return { x: cursorX, y: cursorY };
};

this.setCursorPosition = function setCursorPosition(x, y) {
  if (x !== undefined) {
    x = Math.min(Math.max(Math.floor(x), 0), screenWidth - 1);
  } else {
    x = cursorX;
  }

  if (y !== undefined) {
    y = Math.min(Math.max(Math.floor(y), 0), screenHeight - 1);
  } else {
    y = cursorY;
  }

  if (x === cursorX && y === cursorY) {

    return;
  }

  cursorX = x;
  cursorY = y;
  updateCursor();
};

this.showCursor = function showCursor() {
  cursorVisible = true;
  cursorInterval = setInterval(function() {
    cursorState = !cursorState;
    updateCursor();
  }, 500);
};

this.hideCursor = function hideCursor() {
  clearInterval(cursorInterval);
  cursorVisible = false;
  updateCursor();

};

this.splitScreen = function splitScreen(splitAt) {
  splitPos = splitAt;

  var y;

  for (y = 0; y < screenHeight; y += 1) {
    screenRow[y].style.visibility = (y < splitPos) ? "hidden" : "";
  }

};

function onKey(code) {
  var cb, c, s;

  keyboardRegister = code | 0x80;

  if (charCallback) {
    keyboardRegister = keyboardRegister & 0x7f;

    cb = charCallback;
    charCallback = undefined;
    self.hideCursor();
    cb(String.fromCharCode(code));
  } else if (lineCallback) {
    keyboardRegister = keyboardRegister & 0x7f;

    if (code >= 32 && code <= 127) {
      c = String.fromCharCode(code);
      inputBuffer.push(c);
      self.writeChar(c); 
    } else {
      switch (code) {
        case 8:  
          if (inputBuffer.length > 0) {
            inputBuffer.pop();
            self.setCursorPosition(Math.max(self.getCursorPosition().x - 1, 0), self.getCursorPosition().y);
          }
          break;

        case 13: 

          s = inputBuffer.join("");
          inputBuffer = [];
          self.writeString("\r");

          cb = lineCallback;
          lineCallback = undefined;
          self.hideCursor();
          cb(s);
          break;
      }
    }
  }

} 

    