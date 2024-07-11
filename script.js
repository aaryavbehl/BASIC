
(function () {
    var $ = function (s) { return document.querySelector(s); };
    var $$ = function (s) { return document.querySelectorAll(s); };
  
    var ss = $$('script'), cs = ss[ss.length - 1], baseURL = /^.*\/|/.exec(cs.src)[0];
  
    document.write('<link rel="stylesheet" href="' + baseURL + 'display.css">');
  
    function load(url) { document.write('<script src="' + baseURL + url + '"></script>'); }
    load('https://cdn.rawgit.com/inexorabletash/polyfill/v0.1.25/polyfill.min.js');
    load('https://cdn.rawgit.com/inexorabletash/polyfill/v0.1.25/keyboard.js');
    load('tty.js');
    load('lores.js');
    load('hires.js');
    load('bell.js');
    load('dos.js');
    load('basic.js');
  
    function createInstance(src) {
      function ce(element, attributes, children) {
        var e = document.createElement(element);
        if (attributes) {
          Object.keys(attributes).forEach(function(key) {
            e[key] = attributes[key];
          });
        }
        if (children) {
          children.forEach(function(child) {
            e.appendChild(child);
          });
        }
        return e;
      }
  
      var lores_elem = ce('div', {className: 'jsb-lores'});
      var hgr1_elem = ce('canvas', {className: 'jsb-hires', width: 560, height: 384});
      var hgr2_elem = ce('canvas', {className: 'jsb-hires', width: 560, height: 384});
      var tty_elem = ce('div', {className: 'jsb-tty'});
      var wrapper_elem = ce('div', {className: 'jsb-wrapper'}, [lores_elem, hgr1_elem, hgr2_elem, tty_elem]);
      var frame = ce('div', {className: 'jsb-frame', tabIndex: 0}, [wrapper_elem]);

      var bell = new Bell(baseURL);
      var tty = new TTY(tty_elem, frame, bell.play.bind(bell));
      var dos = new DOS(tty);
      var lores = new LoRes(lores_elem, 40, 48);
      var hires = new HiRes(hgr1_elem, 280, 192);
      var hires2 = new HiRes(hgr2_elem, 280, 192);
      var display = {
        state: { graphics: false, full: true, page1: true, lores: true },
        setState: function (state, value /* ... */) {
          var args = [].slice.call(arguments);
          while (args.length) {
            state = args.shift();
            value = args.shift();
            this.state[state] = value;
          }
  
          if (this.state.graphics) {
            lores.show(this.state.lores);
            hires.show(!this.state.lores && this.state.page1);
            hires2.show(!this.state.lores && !this.state.page1);
            tty.splitScreen(tty.getScreenSize().height - (this.state.full ? 0 : 4));
          } else {
            lores.show(false);
            hires.show(false);
            hires2.show(false);
            tty.splitScreen(0);
          }
        },
        getState: function() {
          return Object.assign({}, this.state);
        }
      };
      var pdl = [0, 0, 0, 0];
  