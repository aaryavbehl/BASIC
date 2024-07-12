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

  function PRNG() {
    var S = 2345678901,
        A = 48271,
        M = 2147483647, 
        Q = M / A, 
        R = M % A; 

    this.next = function PRNG_next() {
      var hi = S / Q,
          lo = S % Q,
          t = A * lo - R * hi;
      S = (t > 0) ? t : t + M;
      this.last = S / M;
      return this.last;
    };
    this.seed = function PRNG_seed(x) {
      S = Math.floor(Math.abs(x));
    };
    this.next();
  }

  function BASICArray(type, dims) {

    var array, dimensions;

    function offset(dims, subscripts) {
      if (subscripts.length !== dimensions.length) {
        runtime_error(ERRORS.BAD_SUBSCRIPT);
      }

      var k, l, s = 0, p, ss;
      for (k = 0; k < dims.length; k += 1) {

        ss = subscripts[k];
        if (ss < 0) {
          runtime_error(ERRORS.ILLEGAL_QUANTITY);
        }
        ss = ss >> 0;
        if (ss >= dims[k]) {
          runtime_error(ERRORS.BAD_SUBSCRIPT);
        }

        p = 1;
        for (l = k + 1; l < dims.length; l += 1) {
          p *= dims[l];
        }
        s += p * ss;
      }
      return s;
    }

    this.dim = function dim(dims) {
      if (array) {
        runtime_error(ERRORS.REDIMED_ARRAY);
      }

      dimensions = dims.map(function(n) { return (Number(n) >> 0) + 1; });

      var i, len = dimensions.reduce(function(a, b) { return a * b; }),
          defval = (type === 'string') ? '' : 0;

      array = [];
      for (i = 0; i < len; i += 1) {
        array[i] = defval;
      }
    };

    this.get = function get(subscripts) {
      if (!array) {
        this.dim(subscripts.map(function() { return 10; }));
      }


      return array[offset(dimensions, subscripts)];
    };

    this.set = function set(subscripts, value) {
      if (!array) {
        this.dim(subscripts.map(function() { return 10; }));
      }

      array[offset(dimensions, subscripts)] = value;
    };

    this.toJSON = function toJSON() {
      return { type: type, dimensions: dimensions, array: array };
    };

    if (dims) {
      this.dim(dims);
    }
  }

  function Stream(string) {
    this.line = 0;
    this.column = 0;

    this.match = function match(re) {
      var m = string.match(re), lines;
      if (m) {
        string = string.substring(m[0].length);
        lines = m[0].split('\n');
        if (lines.length > 1) {
          this.line += lines.length - 1;
          this.column = lines[lines.length - 1].length;
        } else {
          this.column += m[0].length;
        }

        this.lastMatch = m;
        return m;
      }
      return (void 0);
    };

    this.eof = function eof() {
      return string.length === 0;
    };
  }

  var parseDataInput = (function() {

    var regexWhitespace = /^[ \t]+/,
        regexQuotedString = /^"([^"]*?)(?:"|(?=\n|\r|$))/,
        regexUnquotedString = /^[^:,\r\n]*/,
        regexUnquotedStringIgnoreColons = /^[^,\r\n]*/,
        regexComma = /^,/;

    return function parseDataInput(stream, items, ignoreColons) {

      do {
        stream.match(regexWhitespace);

        if (stream.match(regexQuotedString)) {

          items.push(stream.lastMatch[1]);
        } else if (stream.match(ignoreColons ? regexUnquotedStringIgnoreColons : regexUnquotedString)) {

          items.push(stream.lastMatch[0]);
        }
      } while (stream.match(regexComma));
    };
  } ());


  basic.compile = function compile(source) {
    "use strict";

    function vartype(name) {
      var s = name.charAt(name.length - 1);
      return s === '$' ? 'string' : s === '%' ? 'int' : 'float';
    }