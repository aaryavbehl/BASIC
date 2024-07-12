this.basic = (function() {

    var basic = {
      STATE_STOPPED: 0,
      STATE_RUNNING: 1,
      STATE_BLOCKED: 2
    };
  
    basic.ParseError = function(msg, line, column) {
      this.name = 'ParseError';
      this.message = msg || '';
      this.line = line;
      this.column = column;
    };
    basic.ParseError.prototype = new Error();
  
    basic.RuntimeError = function(msg, code) {
      this.name = 'RuntimeError';
      this.message = msg;
      this.code = code;
    };
    basic.RuntimeError.prototype = new Error();
  
    function runtime_error(msg) {
      if (typeof msg === 'object' && msg.length && msg.length >= 2) {
        throw new basic.RuntimeError(msg[1], msg[0]);
      } else {
        throw new basic.RuntimeError(msg);
      }
    }
  
    var ERRORS = {
      NEXT_WITHOUT_FOR: [0, "Next without for"],
      SYNTAX_ERROR: [16, "Syntax error"],
      RETURN_WITHOUT_GOSUB: [22, "Return without gosub"],
      OUT_OF_DATA: [42, "Out of data"],
      ILLEGAL_QUANTITY: [53, "Illegal quantity"],
      OVERFLOW: [69, "Overflow"],
      OUT_OF_MEMORY: [77, "Out of memory"],
      UNDEFINED_STATEMENT: [90, "Undefined statement"],
      BAD_SUBSCRIPT: [107, "Bad subscript"],
      REDIMED_ARRAY: [120, "Redimensioned array"],
      DIVISION_BY_ZERO: [133, "Division by zero"],
      TYPE_MISMATCH: [163, "Type mismatch"],
      STRING_TOO_LONG: [176, "String too long"],
      FORMULA_TOO_COMPLEX: [191, "Formula too complex"],
      UNDEFINED_FUNCTION: [224, "Undefined function"],
      REENTER: [254, "Re-enter"],
      INTERRUPT: [255, "Break"]
    };

    var kws = {
      ABS: "ABS",
      AND: "AND",
      ASC: "ASC",
      ATN: "ATN",
      AT: "AT",
      CALL: "CALL",
      CHR$: "CHR$",
      CLEAR: "CLEAR",
      COLOR: "COLOR=",
      CONT: "CONT",
      COS: "COS",
      DATA: "DATA",
      DEF: "DEF",
      DEL: "DEL",
      DIM: "DIM",
      DRAW: "DRAW",
      END: "END",
      EXP: "EXP",
      FLASH: "FLASH",
      FN: "FN",
      FOR: "FOR",
      FRE: "FRE",
      GET: "GET",
      GOSUB: "GOSUB",
      GOTO: "GOTO",
      GR: "GR",
      HCOLOR: "HCOLOR=",
      HGR2: "HGR2",
      HGR: "HGR",
      HIMEM: "HIMEM:",
      HLIN: "HLIN",
      HOME: "HOME",
      HPLOT: "HPLOT",
      HTAB: "HTAB",
      IF: "IF",
      IN: "IN#",
      INPUT: "INPUT",
      INT: "INT",
      INVERSE: "INVERSE",
      LEFT$: "LEFT$",
      LEN: "LEN",
      LET: "LET",
      LIST: "LIST",
      LOAD: "LOAD",
      LOG: "LOG",
      LOMEM: "LOMEM:",
      MID$: "MID$",
      NEW: "NEW",
      NEXT: "NEXT",
      NORMAL: "NORMAL",
      NOTRACE: "NOTRACE",
      NOT: "NOT",
      ONERR: "ONERR",
      ON: "ON",
      OR: "OR",
      PDL: "PDL",
      PEEK: "PEEK",
      PLOT: "PLOT",
      POKE: "POKE",
      POP: "POP",
      POS: "POS",
      PRINT: "PRINT",
      PR: "PR#",
      READ: "READ",
      RECALL: "RECALL",
      REM: "REM",
      RESTORE: "RESTORE",
      RESUME: "RESUME",
      RETURN: "RETURN",
      RIGHT$: "RIGHT$",
      RND: "RND",
      ROT: "ROT=",
      RUN: "RUN",
      SAVE: "SAVE",
      SCALE: "SCALE=",
      SCRN: "SCRN",
      SGN: "SGN",
      SHLOAD: "SHLOAD",
      SIN: "SIN",
      SPC: "SPC",
      SPEED: "SPEED=",
      SQR: "SQR",
      STEP: "STEP",
      STOP: "STOP",
      STORE: "STORE",
      STR$: "STR$",
      TAB: "TAB",
      TAN: "TAN",
      TEXT: "TEXT",
      THEN: "THEN",
      TO: "TO",
      TRACE: "TRACE",
      USR: "USR",
      VAL: "VAL",
      VLIN: "VLIN",
      VTAB: "VTAB",
      WAIT: "WAIT",
      XDRAW: "XDRAW",
      AMPERSAND: "&",
      QUESTION: "?",
      HSCRN: "HSCRN"
    };
    
  function EndProgram() { }
  function GoToLine(n) { this.line = n; }
  function NextLine() { }
  function BlockingInput(method, callback) {
    this.method = method;
    this.callback = callback;
  }