'use strict';

(function AnimationsHelper(exports) {

  if (exports.AnimationsHelper) {
    return;
  }
  var styles = `
    .overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      background: rgba(199,199,199,0.85);
      transform: scale(0);
      z-index: 1;
    }

    .open {
      opacity: 1;
      transform: scale(1);
    }

    /**
     * .circular
     */

    .overlay.circular {
      width: 40px;
      height: 40px;
      margin: -20px;
      display: block;
      border-radius: 50%;
      will-change: transform, opacity;
      transition-property: opacity, transform;
      transition-timing-function: linear;
    }`;

  exports.AnimationsHelper = {
    overlay: null,
    target: null,
    scheduler: null,

    init: function(opened) {
        this.overlay = document.createElement('div');
        this.overlay.classList.add('overlay');
        document.body.appendChild(this.overlay);

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta && meta.getAttribute('content')) {
          this.overlay.style.backgroundColor = meta.getAttribute('content');
        }

        if (opened) {
          this.overlay.classList.add('open');
        }

        this.scheduler = new DomScheduler();
        this.dispatch('overlayloaded');
    },

    saveTarget: function(e) {
        if (e && ('clientX' in e || e.touches)) {
            this.target = e;
        } else {
            this.target = null;
        }
    },

    animateInFromTarget: function(e) {
      return new Promise(resolve => {
        if (!this.target) {
          resolve();
          return;
        }

        var pos = this.target.touches && this.target.touches[0]
                  || this.target;
        var scale = Math.sqrt(innerWidth * innerHeight) / 10;
        var overlay = this.overlay;
        var duration = scale * 7;
        var end = 'transitionend';
        var self = this;

        var translate = 'translate(' + pos.clientX + 'px, ' +
          pos.clientY + 'px)';

        this.scheduler.transition(() =>  {
           overlay.style.transform = 'translate(' + pos.clientX + 'px, ' +
            pos.clientY + 'px)';
          overlay.classList.add('circular');
          this.dispatch('animationstart');

          var reflow = overlay.offsetTop;

          overlay.style.transitionDuration = duration + 'ms';
          overlay.style.transform += ' scale(' + scale + ')';
          overlay.classList.add('fade-in');
        }, overlay, end).then(() => {
          this.dispatch('animationend');
          this.setOnPageShowListener(translate);
          resolve();
        });
      });
    },

    dispatch: function(name) {
      window.dispatchEvent(new CustomEvent(name));
    },

    clearStyles: function() {
      this.overlay.style.transform = '';
      this.overlay.style.transitionDuration = '';
      this.overlay.classList.remove('fade-in');
    },

    setOnPageShowListener: function(translate) {
      var self = this;
      window.addEventListener('pageshow', function fn() {
        window.removeEventListener('pageshow', fn);
        self.scheduler.transition(() => {
          self.overlay.style.transform = translate + ' scale(0)';
        }, self.overlay, 'transitionend').then(() => {
          self.clearStyles();
        });
      });
    }
  };

  window.addEventListener('load', function fn() {
    window.removeEventListener('load', fn);
    // Append style tag to the header once it has been loaded
    var style = document.createElement('style');
    style.innerHTML = styles;
    document.head.appendChild(style);

    var meta = document.querySelector('meta[name="overlay-open"]');
    var opened = false;
    if (meta && meta.getAttribute('content')) {
      opened = meta.getAttribute('content');
    }

    // Initialize animation helper
    exports.AnimationsHelper.init(opened);
  });

})(window);
