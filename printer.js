function Printer(tty, paper) {
    var tty_writeChar = tty.writeChar;
    tty.writeChar = function(c) {
  
      tty_writeChar(c);
  
      switch (c.charCodeAt(0)) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4: 
        case 5:
        case 6:
        case 7: 
        case 8: 
        case 9:
        case 11: 
        case 12: 
        case 14: 
        case 15: 
        case 16:
        case 17:
        case 18: 
        case 19: 
        case 20:
        case 21: 
        case 22: 
        case 23: 
        case 24: 
        case 25: 
        case 26: 
        case 27: 
        case 28: 
        case 29: 
        case 30: 
        case 31:
          break;
        case 10: 
        case 13: 
          paper.appendChild(document.createTextNode('\n'));
          break;
  
        default:
          paper.appendChild(document.createTextNode(c));
          break;
      }
  
      if ('normalize' in paper) {
        paper.normalize();
      }
      paper.scrollTop = paper.scrollHeight;
    };
  
    this.close = function() {
      tty.writeChar = tty_writeChar;
    };
  }
  