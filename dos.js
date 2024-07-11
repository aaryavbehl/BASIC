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