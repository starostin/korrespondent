function addVendorPrefix(property) {
    var arr = ["ms", "moz", "webkit", "o"], i, tmp = document.createElement("div"),
        result = property.toLowerCase(), arrayOfPrefixes = [];

    function capitalise(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    for (i = 0; i < arr.length; i += 1) {
        arrayOfPrefixes.push(arr[i] + capitalise(property));
    }

    for (i = 0; i < arrayOfPrefixes.length; i += 1) {
        if (tmp.style[arrayOfPrefixes[i]] !== undefined) {
            result = '-' + arr[i] + '-' + property;
            break;
        }
    }
    return result;
}

window.performance = window.performance || {};
window.performance.now = (function () {
    return performance.now ||
    performance.mozNow ||
    performance.msNow ||
    performance.oNow ||
    performance.webkitNow ||
    function () {
        return new Date().getTime();
    };
}());

(function () {
    var lastTime = 0, x, currTime, timeToCall, id, vendors = ['ms', 'moz', 'webkit', 'o'];
    for (x = 0; x < vendors.length && !window.requestAnimationFrame; x += 1) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
        || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
            currTime = window.performance.now();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

function ScrollView(element, options) {
    var scrollView = this, validPosition, tmpVar, event;
    function mix(obj, mixin) {
        var attr;
        for (attr in mixin) {
            if (mixin.hasOwnProperty(attr)) {
                obj[attr] = mixin[attr];
            }
        }
        return obj;
    }
    // options for current instance of scrollview
    this._options = mix({
        preventMove: true,
        resizeEvent: true,
        scroll: true,
        bounds: true,
        direction: 'vertical',
        marginMIN: 0,
        marginMAX: 0,
        onScroll: function (shift) {
        },
        onScrollBefore: function (shift) {
            return true;
        },
        onScrollAfter: function () {
        },
        onScrollTypeChange: function (type) {
        }
    }, options);

    // initialize inner variables on creation
    if (this._options.direction === 'vertical') {
        this._transitionArray = ["translate3d(0, ", 0, "px, 0)"];
        this._coordName = 'screenY';
        this._speedName = 'speedY';
    } else {
        this._transitionArray = ["translate3d(", 0, "px, 0, 0)"];
        this._coordName = 'screenX';
        this._speedName = 'speedX';
    }
    this._animParams = null; //move or not in current time scrolling view
    this._RafID = null; // ID of request animation frame
    this._lastPointerPosition = 0; // position of touch pointer, when is touched
    this._shift = 0; //shift for next RAF tick
    this._motionType = this._lastMotionType = this._STRINGS.stop;
    this._isMoved = false;
    this._tmp = {shift: 0, now: 0, easing: 0, velocity: 0};
    this._pos = 0;
    this._root = element;
    this._wrapper = element.querySelector('.scroll');

    // prepare environment
    validPosition = ['fixed', 'relative', 'absolute'];
    tmpVar = validPosition.indexOf(window.getComputedStyle(element, null).position);
    if (tmpVar === -1) {
        tmpVar = validPosition.indexOf(element.style.position);
    }
    this._root.style.position = (tmpVar === -1) ? 'relative' : validPosition[tmpVar];
    this._root.style.overflow = 'hidden';

    this._wrapper.style.margin = 0;
    this._wrapper.style.marginTop = (this._options.marginTop || 0) + 'px';
    this._wrapper.style.width = '100%';
    this._wrapper.style.position = 'absolute';
    this._wrapper.style[this._transitionName] = 'transform 0ms';

    for (event in this.TRACKING_EVENTS) {
        if (this.TRACKING_EVENTS.hasOwnProperty(event)) {
            this._root.addEventListener(this.TRACKING_EVENTS[event], this, false);
        }
    }

    if (this._options.resizeEvent) {
        window.addEventListener(this.TRACKING_EVENTS.resize, this, false);
    }

    // animation step function
    this._animationStep = function (timestamp) {

        if (!scrollView._options.scroll) {
            return;
        }

        scrollView._calculateShift(timestamp);
        scrollView._pos -= scrollView._shift;

        // check bounds
        if ((scrollView._motionType !== scrollView._STRINGS.tweak) || (scrollView._motionType !== scrollView._STRINGS.stop)) {
            if (scrollView._pos < scrollView._min - scrollView._margine) {
                scrollView._pos = scrollView._min - scrollView._margine;
                scrollView._motionType = scrollView._STRINGS.checkTweak;
            }
            if (scrollView._pos > scrollView._margine + scrollView._max) {
                scrollView._pos = scrollView._margine + scrollView._max;
                scrollView._motionType = scrollView._STRINGS.checkTweak;
            }
        }

        if (scrollView._shift !== 0) { // callbacks
            if ((!scrollView._isMoved) && !scrollView._options.onScrollBefore(scrollView._shift)) {
                scrollView._motionType = scrollView._STRINGS.stop;
            } else {
                scrollView._isMoved = true;
                scrollView._options.onScroll(scrollView._shift, scrollView._pos);

                // call onScrollTypeChange callback if type of motion was changed
                if ((scrollView._lastMotionType !== scrollView._motionType) && (scrollView._motionType !== scrollView._STRINGS.checkTweak) && (scrollView._motionType !== scrollView._STRINGS.stop)) {
                    scrollView._options.onScrollTypeChange(scrollView._motionType);
                    scrollView._lastMotionType = scrollView._motionType;
                }
            }
        }
        scrollView._transitionArray[1] = scrollView._pos;

        // endpoint round or post next loop
        if (scrollView._motionType === scrollView._STRINGS.stop) {
            scrollView._transitionArray[1] = Math.round(scrollView._transitionArray[1]);
            if (scrollView._isMoved) {
                scrollView._options.onScrollAfter();
            }
            scrollView._isMoved = false;
        } else {
            scrollView._RafID = window.requestAnimationFrame(scrollView._animationStep);
        }

        scrollView._wrapper.style[scrollView._transformName] = scrollView._transitionArray.join("");

        scrollView._shift = 0;
    };

    // start
    this.refresh();
}

ScrollView.prototype = {

    TRACKING_EVENTS: {
        resize: 'resize',
        up: 'pointerup',
        move: 'pointermove',
        down: 'pointerdown',
        chancel: 'pointercancel',
        fling: 'fling'
    },

    _STRINGS: {
        tweak: 'tweak',
        checkTweak: 'checkTweak',
        stop: 'stop',
        scroll: 'scroll',
        fling: 'fling',
        move: 'move'
    },

    _transitionName: addVendorPrefix("transition"),

    _transformName: addVendorPrefix("transform"),

    _calculateShift: function (now) {
        // if it first time of RAF loop - save timestamp for calculations
        if (this._animParams.startTime === null) {
            this._animParams.startTime = now;
            this._animParams.lastTime = now;
        }

        // check different types of motion
        switch (this._motionType) {
            case this._STRINGS.move:
                this._shift /= ((this._pos < this._min) || (this._pos > this._max)) ? 3 : 1;
                break;
            case this._STRINGS.fling:
                if(this._disable) return;
                // setup shift value & decrease velocity
                this._shift = this._animParams.velocity * (now - this._animParams.lastTime);
                this._tmp.velocity = this._animParams.velocity + this._animParams.a * (now - this._animParams.startTime);

                // check changing of velocity sign
                if (this._tmp.velocity / this._animParams.velocity > 0) {
                    this._animParams.velocity = this._tmp.velocity;

                    // decrease velocity when scroller out of borders
                    if (((this._pos < this._min) && (this._animParams.velocity > 0)) || ((this._pos > this._max) && (this._animParams.velocity < 0))) {
                        this._animParams.velocity += -this._animParams.velocity * 0.6;
                        if (Math.abs(this._shift) < 0.1) {
                            this._motionType = this._STRINGS.checkTweak;
                        }
                    }
                } else {
                    this._motionType = this._STRINGS.checkTweak;
                }
                break;
            case this._STRINGS.tweak:
            case this._STRINGS.scroll:
                if(this._disable) return;
                this._tmp.now = Math.ceil(1000 * (now - this._animParams.startTime) / this._animParams.duration) / 1000;
                this._tmp.easing = this.easeFunc(this._tmp.now);
                this._tmp.shift = Math.ceil(1000 * this._animParams.shift * this._tmp.easing) / 1000;

                if (this._animParams.duration !== 0) {
                    this._shift = this._tmp.shift - this._animParams.lastShift;
                } else {
                    this._shift = this._animParams.shift;
                    this._tmp.now = 1;
                }

                if (this._tmp.now >= 1) {
                    if (this._motionType === this._STRINGS.tweak) {
                        this._shift = this._animParams.shift - this._animParams.lastShift;
                        this._motionType = this._STRINGS.stop;
                    } else {
                        this._motionType = this._STRINGS.checkTweak;
                    }
                }

                this._animParams.lastShift = this._tmp.shift;
                break;
            case this._STRINGS.checkTweak:
                this._tmp.shift = (this._pos > this._max) ? this._max - this._pos : (this._pos < this._min) ? this._min - this._pos : 0;

                if (this._options.tweak && this._tmp.shift === 0) {
                    if (this._pos < this._max && this._pos > this._min) {
                        this._tmp.shift = this._pos - Math.ceil(1000 * Math.round(this._pos / this._options.tweak) * this._options.tweak) / 1000;
                        this._tmp.shift = -this._tmp.shift;
                    }
                }

                this._animParams = {
                    shift: -this._tmp.shift,
                    lastShift: 0,
                    duration: 250,
                    startTime: now,
                    lastTime: null
                };

                this._motionType = (this._tmp.shift !== 0) ? this._STRINGS.tweak : this._STRINGS.stop;
                break;
        }

        this._animParams.lastTime = now;
        this._shift = (!isNaN(this._shift)) ? this._shift : 0;
    },

    _eventPointerDown: function (e) {
        // stop any animations
        window.cancelAnimationFrame(this._RafID);

        //save current position for next loop of RAF
        this._lastPointerPosition = e[this._coordName];

        //start looping by RAF
        this._animParams = {};
        this._motionType = this._STRINGS.move;
        this._RafID = window.requestAnimationFrame(this._animationStep);
    },

    _eventPointerMove: function (e) {
        this._shift += this._lastPointerPosition - e[this._coordName];
        this._lastPointerPosition = e[this._coordName];
    },

    _eventPointerUp: function (e) {
        if (this._motionType !== this._STRINGS.fling) {
            this._motionType = this._STRINGS.checkTweak;
        }
        this._eventPointerMove(e);
    },

    _eventFling: function (e) {
        var V = this._options.scroll ? -e[this._speedName] : 0;

        if (V === 0) {
            return;
        }

        this._animParams = {
            velocity: V,
            a: -(V < 0 ? -1 : 1) * 0.00009,
            startTime: null,
            lastTime: null
        };
        this._motionType = this._STRINGS.fling;
    },

    // =================================== public attributes and methods ===================================
    preventDefaultTags: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/,

    easeFunc: function (t) {
        return t * (2 - t);
    },

    destroy: function () {
        var e;
        for (e in this.TRACKING_EVENTS) {
            if (this.TRACKING_EVENTS.hasOwnProperty(e)) {
                this._root.removeEventListener(this.TRACKING_EVENTS[e], this);
            }
        }
        window.removeEventListener(this.TRACKING_EVENTS.resize, this);

        window.cancelAnimationFrame(this._RafID);
        this._root = null;
        this._wrapper = null;
        this._options = null;
    },

    refresh: function () {
        var rootWidth = this._root.offsetWidth, rootHeight = this._root.offsetHeight;

        window.cancelAnimationFrame(this._RafID);
        this._motionType = this._STRINGS.stop;

        if (this._options.direction === 'vertical') {
            this._min = (rootHeight <= this._wrapper.clientHeight) ? rootHeight - this._wrapper.clientHeight - this._options.marginMAX : 0;
            this._margine = (this._options.bounds) ? Math.round(rootHeight / 3) : 0;
        } else {
            this._min = (rootWidth <= this._wrapper.offsetWidth) ? rootWidth - this._wrapper.clientWidth - this._options.marginMAX : 0;
            this._margine = (this._options.bounds) ? Math.round(rootWidth / 3) : 0;
        }
        this._max = this._options.marginMIN;

        // prepare and start tweak
        this._motionType = this._STRINGS.checkTweak;
        this._animParams = {};
        this._RafID = window.requestAnimationFrame(this._animationStep);
    },
    disable: function(){
        this._disable = true
    },
    enable: function(){
        this._disable = false
    },

    scroll: function (shift, duration) {
        var newDuration = duration, newShift, newPos;

        window.cancelAnimationFrame(this._RafID);
        this._motionType = this._STRINGS.stop;

        // check bounds
        if (shift !== 0) {
            newPos = this._pos + shift;
            if (newPos < this._min) {
                newShift = this._min - this._pos;
                newDuration = Math.abs(Math.round(duration * newShift / shift));
                shift = newShift;

            }
            if (newPos > this._max) {
                newShift = this._max - this._pos;
                newDuration = Math.abs(Math.round(duration * newShift / shift));
                shift = newShift;
            }
        }

        shift = this._options.scroll ? shift : 0;

        //start looping by RAF
        this._motionType = this._STRINGS.scroll;
        this._animParams = {
            shift: -shift,
            lastShift: 0,
            duration: newDuration,
            startTime: null,
            lastTime: null
        };
        this._RafID = window.requestAnimationFrame(this._animationStep);
    },

    handleEvent: function (e) {
        var self = this;

        switch (e.type) {
            case this.TRACKING_EVENTS.down:
                if(this._disable) return;
                this._eventPointerDown(e);
                break;
            case this.TRACKING_EVENTS.move:
                if(this._disable) return;
                this._eventPointerMove(e);
                if (this._options.preventMove && !this.preventDefaultTags.test(e.target)) {
                    e.preventDefault();
                }
                break;
            case this.TRACKING_EVENTS.chancel:
            case this.TRACKING_EVENTS.up:
                if(this._disable) return;
                this._eventPointerUp(e);
                break;
            case this.TRACKING_EVENTS.fling:
                if(this._disable) return;
                this._eventFling(e);
                break;
            case this.TRACKING_EVENTS.resize:
                clearTimeout(this._resizeID);
                this._resizeID = setTimeout(function () {
                    self.refresh();
                }, 150);
                break;
        }
    }
};