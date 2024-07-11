function DOS(tty) {

    var DOSErrors = {
      LANGUAGE_NOT_AVAILABLE: [1, "Language not available"],
      RANGE_ERROR: [2, 'Range error'],
      WRITE_PROTECTED: [4, 'Write protected'],
      END_OF_DATA: [5, 'End of data'],
      FILE_NOT_FOUND: [6, 'File not found'],
      VOLUME_MISMATCH: [7, 'Volume mismatch'],
      IO_ERROR: [8, 'I/O error'],
      DISK_FULL: [9, 'Disk full'],
      FILE_LOCKED: [10, 'File locked'],
      INVALID_OPTION: [11, 'Invalid option'],
      NO_BUFFERS_AVAILABLE: [12, 'No buffers available'],
      FILE_TYPE_MISMATCH: [13, 'File type mismatch'],
      PROGRAM_TOO_LARGE: [14, 'Program too large'],
      NOT_DIRECT_COMMAND: [15, 'Not direct command'],
  
      SYNTAX_ERROR: [16, "Syntax error"]
    },
  
        STORAGE_PREFIX = 'vfs/',
  
        MON_I = 1,
        MON_C = 2,
        MON_O = 4,

        tty_readLine,
        tty_readChar,
        tty_writeChar,

        hooked_readLine,
        hooked_readChar,
        hooked_writeChar,

        commandBuffer = "",
        commandMode = false,

        buffers = {},
        activebuffer = null,
        mode = "",
  
        monico = 0;
        function doserror(msg) {
          throw new basic.RuntimeError(msg[1], msg[0]);
        }
      
        function parseArgs(str, opts) {
          str = str || '';
          opts = opts || '';
      
          var args = {
            V: 0, 
            D: 0,
            S: 0,
            L: 0,
            R: 0,
            B: 0,
            A: 0,
            C: undefined,
            I: undefined,
            O: undefined 
          };
      
          var m;
          while ((m = str.match(/^,?\s*([VDSLRBACIO])\s*([0-9]+|\$[0-9A-Fa-f]+)?\s*([\x20-\x7E]*)/))) {
            if (opts.indexOf(m[1]) === -1) {
              doserror(DOSErrors.INVALID_OPTION);
            }
            args[m[1]] = Number(m[2]);
            str = m[3];
          }
      
          if (str.length > 0) {
            doserror(DOSErrors.INVALID_OPTION);
          }
      
          return args;
        }
      
        function vfs_set(key, value) {
          return window.localStorage.setItem(STORAGE_PREFIX + key, encodeURIComponent(value));
        }
        function vfs_get(key) {
          var item = window.localStorage.getItem(STORAGE_PREFIX + key);
          return item !== null ? decodeURIComponent(item) : null;
        }
        function vfs_remove(key) {
          return window.localStorage.removeItem(STORAGE_PREFIX + key);
        }
      
        this.reset = function reset() {
          buffers = {};
          activebuffer = null;
          mode = "";
        };
      
        function unlink(filename) {
          var item = vfs_get(filename);
      
          if (item === null) {
            doserror(DOSErrors.FILE_NOT_FOUND);
          }
      
          vfs_remove(filename);
        }
      
        function rename(oldname, newname) {
          var item = vfs_get(oldname);
      
          if (item === null) {
            doserror(DOSErrors.FILE_NOT_FOUND);
          }
      
          vfs_remove(oldname);
          vfs_set(newname, item);
        }
      
        function open(filename, recordlength) {
          if (recordlength === 0) {

            recordlength = 1;
          }

          var file = vfs_get(filename),
                  req, url, async;
          if (file === null) {
            req = new XMLHttpRequest();
            url = "vfs/" + encodeURIComponent(filename.replace(/\./g, '_')) + ".txt";
            async = false;
            req.open("GET", url, async);
            req.send(null);
            if (req.status === 200 || req.status === 0) { 
              file = req.responseText.replace(/\r\n/g, "\r");
              vfs_set(filename, file);
            }
          }

          buffers[filename] = {
            file: file,
            recordlength: recordlength,
            recordnum: 0,
            filepointer: 0
          };
        }
      
        function append(filename, recordlength) {

          open(filename, recordlength);
      
          if (!Object.prototype.hasOwnProperty.call(buffers, filename)) {
            doserror(DOSErrors.FILE_NOT_FOUND);
          }
      
          var buf = buffers[filename];

          buf.filepointer = buf.file.length;
          buf.recordnum = Math.floor(buf.filepointer / buf.recordlength);
        }
      
        function close(filename) {
          var buf, fn;

          if (!filename) {
            for (fn in buffers) {
              if (Object.prototype.hasOwnProperty.call(buffers, fn)) {
                close(fn);
              }
            }
            return;
          }
      
          buf = buffers[filename];
          if (buf) {

            vfs_set(filename, buf.file);
      
            delete buffers[filename];
            if (buf === activebuffer) {
              activebuffer = null;
              mode = "";
            }
          }
        }
      
        function read(filename, recordnum, bytenum) {
          var buf = buffers[filename];
          if (!buf) {

            open(filename, 0);
            buf = buffers[filename];
          }
      
          if (buf.file === null) {
            doserror(DOSErrors.FILE_NOT_FOUND);
          }
      
          buf.recordnum = recordnum;
          buf.filepointer = buf.recordlength * recordnum + bytenum;

          activebuffer = buf;
          mode = "r";
        }