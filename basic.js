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

    peek_table = {

      0x0020: function() { return env.tty.textWindow ? env.tty.textWindow.left : 0; },
      0x0021: function() { return env.tty.textWindow ? env.tty.textWindow.width : 80; },
      0x0022: function() { return env.tty.textWindow ? env.tty.textWindow.top : 0; },
      0x0023: function() { return env.tty.textWindow ? env.tty.textWindow.top + env.tty.textWindow.height : 24; },
      0x0024: function() { return env.tty.getCursorPosition().x; },
      0x0025: function() { return env.tty.getCursorPosition().y; },

      0x004e: function() { return (Math.random() * 256) & 0xff; },
      0x004f: function() { return (Math.random() * 256) & 0xff; },

      0x00de: function() { return state.onerr_code; },

      0x00e6: function() { return env.display ? (env.display.hires_plotting_page === 2 ? 64 : 32) : 0; },

      0xC000: function() { return env.tty.getKeyboardRegister ? env.tty.getKeyboardRegister() : 0; },
      0xC010: function() { return env.tty.clearKeyboardStrobe ? env.tty.clearKeyboardStrobe() : 0; },

      0xC030: function() { return 0; },

      0xC060: function() { return env.tty.getButtonState ? env.tty.getButtonState(3) : 0; },
      0xC061: function() { return env.tty.getButtonState ? env.tty.getButtonState(0) : 0; },
      0xC062: function() { return env.tty.getButtonState ? env.tty.getButtonState(1) : 0; },
      0xC063: function() { return env.tty.getButtonState ? env.tty.getButtonState(2) : 0; },

      0xC01A: function() { return (env.display && !env.display.getState().graphics) * 128; },
      0xC01B: function() { return (env.display && !env.display.getState().full) * 128; },
      0xC01C: function() { return (env.display && !env.display.getState().page1) * 128; },
      0xC01D: function() { return (env.display && !env.display.getState().lores) * 128; },
      0xC01E: function() { return (env.tty.isAltCharset && env.tty.isAltCharset()) * 128; },
      0xC01F: function() { return (env.tty.isFirmwareActive && env.tty.isFirmwareActive()) * 128; }
    };

    poke_table = {

      0x0020: function(v) { if (env.tty.textWindow) { env.tty.textWindow.left = v; } },
      0x0021: function(v) { if (env.tty.textWindow) { env.tty.textWindow.width = v; } },
      0x0022: function(v) { if (env.tty.textWindow) {
        var bottom = env.tty.textWindow.top + env.tty.textWindow.height;
        env.tty.textWindow.top = v;
        env.tty.textWindow.height = bottom - env.tty.textWindow.top;
      } },
      0x0023: function(v) { if (env.tty.textWindow) { env.tty.textWindow.height = v - env.tty.textWindow.top; } },
      0x0024: function(v) { env.tty.setCursorPosition(v, void 0); },
      0x0025: function(v) { env.tty.setCursorPosition(void 0, v); },

      0x00D8: function(v) { if (v < 0x80) { state.onerr_handler = (void 0); } },

      0x00E6: function(v) { if (env.display) { env.display.hires_plotting_page = (v === 64 ? 2 : 1); } },

      0xC010: function() { if (env.tty.clearKeyboardStrobe) { env.tty.clearKeyboardStrobe(); } },

      0xC050: function() { if (env.display) { env.display.setState("graphics", true); } }, 
      0xC051: function() { if (env.display) { env.display.setState("graphics", false); } }, 
      0xC052: function() { if (env.display) { env.display.setState("full", true); } }, 
      0xC053: function() { if (env.display) { env.display.setState("full", false); } }, 
      0xC054: function() { if (env.display) { env.display.setState("page1", true); } }, 
      0xC055: function() { if (env.display) { env.display.setState("page1", false); } }, 
      0xC056: function() { if (env.display) { env.display.setState("lores", true); } }, 
      0xC057: function() { if (env.display) { env.display.setState("lores", false); } }, 

      0xC030: function() { } 
    };

    call_table = {
      0xD683: function() {
        state.stack = [];
      },
      0xF328: function() { 
        var stack_record = state.stack.pop();
        if (!{}.hasOwnProperty.call(stack_record, 'resume_stmt_index')) {
          runtime_error(ERRORS.SYNTAX_ERROR);
          return;
        }
      },
      0xF3E4: function() { 
        if (!env.hires) { runtime_error('Hires graphics not supported'); }
        env.display.setState('graphics', true, 'full', true, 'page1', true, 'lores', false);
      },
      0xF3F2: function() { 
        var hires = env.display.hires_plotting_page === 2 ? env.hires2 : env.hires;
        if (!hires) { runtime_error('Hires graphics not supported'); }
        hires.clear();
      },
      0xF3F6: function() { 
        var hires = env.display.hires_plotting_page === 2 ? env.hires2 : env.hires;
        if (!hires) { runtime_error('Hires graphics not supported'); }
        hires.clear(hires.color);
      },
      0xFBF4: function() { 
        if (env.tty.cursorRight) { env.tty.cursorRight(); }
      },
      0xFC10: function() { 
        if (env.tty.cursorLeft) { env.tty.cursorLeft(); }
      },
      0xFC1A: function() { 
        if (env.tty.cursorUp) { env.tty.cursorUp(); }
      },
      0xFC42: function() {
        if (env.tty.clearEOS) { env.tty.clearEOS(); }
      },
      0xFC66: function() { 
        if (env.tty.cursorDown) { env.tty.cursorDown(); }
      },
      0xFC9C: function() { 
        if (env.tty.clearEOL) { env.tty.clearEOL(); }
      },
      0xFD0C: function() { 
        throw new BlockingInput(env.tty.readChar, function(_){});
      },
      0xFE84: function() { 
        if (env.tty.setTextStyle) { env.tty.setTextStyle(env.tty.TEXT_STYLE_NORMAL); }
      },
      0xFE80: function() { 
        if (env.tty.setTextStyle) { env.tty.setTextStyle(env.tty.TEXT_STYLE_INVERSE); }
      }
    };

    lib = {

      'clear': function CLEAR() {
        state.clear();
      },

      'dim': function DIM(name, subscripts) {
        state.arrays[name].dim(subscripts);
      },

      'def': function DEF(name, func) {
        state.functions[name] = func;
      },

      'goto': function GOTO(line) {
        throw new GoToLine(line);
      },

      'on_goto': function ON_GOTO(index /* , ...lines */) {
        index = Math.floor(index);
        if (index < 0 || index > 255) {
          runtime_error(ERRORS.ILLEGAL_QUANTITY);
        }
        --index;
        var lines = Array.prototype.slice.call(arguments, 1);

        if (index >= 0 && index < lines.length) {
          throw new GoToLine(lines[index]);
        }
      },

      'gosub': function GOSUB(line) {
        state.stack.push({
          gosub_return: state.stmt_index,
          line_number: state.line_number
        });
        throw new GoToLine(line);
      },
    
      var env,          
      lib,       
      funlib,    
      peek_table,
      poke_table,
      call_table;

    'on_gosub': function ON_GOSUB(index /* , ...lines */) {
      index = Math.floor(index);
      if (index < 0 || index > 255) {
        runtime_error(ERRORS.ILLEGAL_QUANTITY);
      }
      --index;
      var lines = Array.prototype.slice.call(arguments, 1);
      if (index >= 0 && index < lines.length) {
        state.stack.push({
          gosub_return: state.stmt_index,
          line_number: state.line_number
        });
        throw new GoToLine(lines[index]);
      }
    },
    'return': function RETURN() {
        var stack_record;
        while (state.stack.length) {
          stack_record = state.stack.pop();
          if ({}.hasOwnProperty.call(stack_record, 'gosub_return')) {
            state.stmt_index = stack_record.gosub_return;
            state.line_number = stack_record.line_number;
            return;
          }
        }
        runtime_error(ERRORS.RETURN_WITHOUT_GOSUB);
      },

      'pop': function POP() {
        var stack_record = state.stack.pop();
        if (!{}.hasOwnProperty.call(stack_record, 'gosub_return')) {
          runtime_error(ERRORS.RETURN_WITHOUT_GOSUB);
          return;
        }
      },

      'for': function FOR(varname, to, step) {
        state.stack.push({
          index: varname,
          to: to,
          step: step,
          for_next: state.stmt_index,
          line_number: state.line_number
        });
      },

      'next': function NEXT(/* ...varnames */) {
        var varnames = Array.prototype.slice.call(arguments),
                    varname, stack_record, value;
        do {
          varname = varnames.shift();

          do {
            stack_record = state.stack.pop();
            if (!stack_record || !{}.hasOwnProperty.call(stack_record, 'for_next')) {
              runtime_error(ERRORS.NEXT_WITHOUT_FOR);
            }
          } while (varname !== (void 0) && stack_record.index !== varname);

          value = state.variables[stack_record.index];

          value = value + stack_record.step;
          state.variables[stack_record.index] = value;

          if (!(stack_record.step > 0 && value > stack_record.to) &&
                        !(stack_record.step < 0 && value < stack_record.to) &&
                        !(stack_record.step === 0 && value === stack_record.to)) {
            state.stack.push(stack_record);
            state.stmt_index = stack_record.for_next;
            state.line_number = stack_record.line_number;
            return;
          }
        } while (varnames.length);
      },

      'if': function IF(value) {
        if (!value) {
          throw new NextLine();
        }
      },

      'stop': function STOP() {
        runtime_error(ERRORS.INTERRUPT);
      },

      'end': function END() {
        throw new EndProgram();
      },

      'onerr_goto': function ONERR_GOTO(line) {
        state.onerr_handler = line;
        throw new NextLine();
      },

      'resume': function RESUME() {
        var stack_record = state.stack.pop();
        if (!{}.hasOwnProperty.call(stack_record, 'resume_stmt_index')) {
          runtime_error(ERRORS.SYNTAX_ERROR);
          return;
        }
        state.line_number = stack_record.resume_line_number;
        state.stmt_index = stack_record.resume_stmt_index;
      },

      'restore': function RESTORE() {
        state.data_index = 0;
      },

      'read': function READ(/* ...lvalues */) {
        var lvalues = Array.prototype.slice.call(arguments);
        while (lvalues.length) {
          if (state.data_index >= state.data.length) {
            runtime_error(ERRORS.OUT_OF_DATA);
          }
          (lvalues.shift())(state.data[state.data_index]);
          state.data_index += 1;
        }
      },

      'print': function PRINT(/* ...strings */) {
        var args = Array.prototype.slice.call(arguments), arg;
        while (args.length) {
          arg = args.shift();
          if (typeof arg === 'function') {
            arg = arg();
          }
          env.tty.writeString(String(arg));
        }
      },

      'comma': function COMMA() {
        return function() {
          var cur = env.tty.getCursorPosition().x,
                        pos = (cur + 16) - (cur % 16);
          if (pos >= env.tty.getScreenSize().width) {
            return '\r';
          } else {
            return ' '.repeat(pos - cur);
          }
        };
      },

      'spc': function SPC(n) {
        n = n >> 0;
        if (n < 0 || n > 255) {
          runtime_error(ERRORS.ILLEGAL_QUANTITY);
        }
        return function() {
          return ' '.repeat(n);
        };
      },

      'tab': function TAB(n) {
        n = n >> 0;
        if (n < 0 || n > 255) {
          runtime_error(ERRORS.ILLEGAL_QUANTITY);
        }
        if (n === 0) { n = 256; }

        return function() {
          var pos = env.tty.getCursorPosition().x + 1;
          return ' '.repeat(pos >= n ? 0 : n - pos);
        };
      },

      'get': function GET(lvalue) {
        throw new BlockingInput(env.tty.readChar, function(entry) { lvalue(entry); });
      },

      'input': function INPUT(prompt /* , ...varlist */) {
        var varlist = Array.prototype.slice.call(arguments, 1); 
        var im = function(cb) { return env.tty.readLine(cb, prompt); };
        var ih = function(entry) {
          var parts = [],
              stream = new Stream(entry);

          parseDataInput(stream, parts, entry.ignoreColons);

          while (varlist.length && parts.length) {
            try {
              varlist.shift()(parts.shift());
            } catch (e) {
              if (e instanceof basic.RuntimeError &&
                  e.code === ERRORS.TYPE_MISMATCH[0]) {
                e.code = ERRORS.REENTER[0];
                e.message = ERRORS.REENTER[1];
              }
              throw e;
            }
          }

          if (varlist.length) {
            prompt = '??';
            throw new BlockingInput(im, ih);
          }

          if (parts.length) {
            env.tty.writeString('?EXTRA IGNORED\r');
          }
        };
        throw new BlockingInput(im, ih);
      },

      'home': function HOME() {
        if (env.tty.clearScreen) { env.tty.clearScreen(); }
      },

      'htab': function HTAB(pos) {
        if (pos < 1 || pos >= env.tty.getScreenSize().width + 1) {
          runtime_error(ERRORS.ILLEGAL_QUANTITY);
        }

        if (env.tty.textWindow) {
          pos += env.tty.textWindow.left;
        }

        env.tty.setCursorPosition(pos - 1, void 0);
      },

      'vtab': function VTAB(pos) {
        if (pos < 1 || pos >= env.tty.getScreenSize().height + 1) {
          runtime_error(ERRORS.ILLEGAL_QUANTITY);
        }
        env.tty.setCursorPosition(void 0, pos - 1);
      },

      'inverse': function INVERSE() {
        if (env.tty.setTextStyle) { env.tty.setTextStyle(env.tty.TEXT_STYLE_INVERSE); }
      },
      'flash': function FLASH() {
        if (env.tty.setTextStyle) { env.tty.setTextStyle(env.tty.TEXT_STYLE_FLASH); }
      },
      'normal': function NORMAL() {
        if (env.tty.setTextStyle) { env.tty.setTextStyle(env.tty.TEXT_STYLE_NORMAL); }
      },
      'text': function TEXT() {
        if (env.display) {
          env.display.setState("graphics", false);
        }

        if (env.tty.textWindow) {

          env.tty.textWindow = {
            left: 0,
            top: 0,
            width: env.tty.getScreenSize().width,
            height: env.tty.getScreenSize().height
          };
        }
        env.tty.setCursorPosition(0, env.tty.getScreenSize().height - 1);
      },