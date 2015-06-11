'use strict';

(function AnimationsHelper(exports) {

  if (exports.AnimationsHelper) {
    return;
  }
  var styles = `
    .background {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      background: rgba(199,199,199,0.85);
      transform: scale(0);
      z-index: 1;
    }

    /**
     * .circular
     */

    .background.circular {
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
    background: null,
    target: null,
    scheduler: null,

    init: function() {
        this.background = document.createElement('div');
        this.background.classList.add('background');
        document.body.appendChild(this.background);
        this.scheduler = new DomScheduler();
        this.dispatch('backgroundloaded');
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
        var background = this.background;
        var duration = scale * 7;
        var end = 'transitionend';
        var self = this;

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta && meta.getAttribute('content')) {
          background.style.backgroundColor = meta.getAttribute('content');
        }

        var translate = 'translate(' + pos.clientX + 'px, ' +
          pos.clientY + 'px)';

        this.scheduler.transition(() =>  {
           background.style.transform = 'translate(' + pos.clientX + 'px, ' +
            pos.clientY + 'px)';
          background.classList.add('circular');
          this.dispatch('animationstart');

          var reflow = background.offsetTop;

          background.style.transitionDuration = duration + 'ms';
          background.style.transform += ' scale(' + scale + ')';
          background.classList.add('fade-in');
        }, background, end).then(() => {
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
      this.background.style.transform = '';
      this.background.style.transitionDuration = '';
      this.background.classList.remove('fade-in');
    },

    setOnPageShowListener: function(translate) {
      var self = this;
      window.addEventListener('pageshow', function fn() {
        window.removeEventListener('pageshow', fn);
        self.scheduler.transition(() => {
          self.background.style.transform = translate + ' scale(0)';
        }, self.background, 'transitionend').then(() => {
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

    // Initialize animation helper
    exports.AnimationsHelper.init();
  });

})(window);
