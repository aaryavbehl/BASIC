function pos(code, sw) {
    var x = Math.floor(code / 16);
    var y = code % 16;
    var sx = ( sw > 40 ? 1 : 2 );
    var sy = 2;
    x = -sx * (7 * x);
    y = -sy * (8 * y);
    return String(x) + 'px ' + String(y) + 'px';
  }
  
  function gen(cc, sc, sw, styles) {
    console.log('.jsb-'+sw+'col'+styles+' .jsb-chr'+cc+' { background-position: '+ pos(sc,sw)+' }');
  }
  
  var sw, i;
  for( sw = 40; sw <= 80; sw += 40) {
  
    for (i = 0x00; i < 0x20; i++) { gen(i+0x00, i+0xC0, sw, ''); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0x20, i+0xA0, sw, ''); }
  
    for (i = 0x00; i < 0x20; i++) { gen(i+0x40, i+0x40, sw, ''); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0x40, i+0xC0, sw, '.jsb-flash'); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0x60, i+0x20, sw, ''); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0x60, i+0xA0, sw, '.jsb-flash'); }
  
    for (i = 0x00; i < 0x20; i++) { gen(i+0x40, i+0x80, sw, '.jsb-active'); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0x60, i+0xE0, sw, '.jsb-active'); }
  
    for (i = 0x00; i < 0x20; i++) { gen(i+0x80, i+0x40, sw, ''); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0xA0, i+0x20, sw, ''); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0xC0, i+0x40, sw, ''); }
    for (i = 0x00; i < 0x20; i++) { gen(i+0xE0, i+0x60, sw, ''); }

    for (i = 0x00; i < 0x20; i++) { gen(i+0x100, i+0x100, sw, ''); }
  }
  