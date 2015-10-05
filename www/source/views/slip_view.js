RAD.views.SlipExt = RAD.views.SwipeExt.extend({
    slip_events: {
        'slip:beforeswipe' : 'onBeforeSwipe',
        'slip:swipe' : 'onSwipe',
        'slip:beforereorder' : 'onBeforeReorder',
        'slip:reorder' : 'onReorder',
        'slip:beforewait' : 'onBeforeWait',
        'slip:tap' : 'onTap',
        'slip:cancelswipe' : 'onCancelSwipe'
    },
    onrender: function () {
        "use strict";
        RAD.views.SwipeExt.prototype.onrender.call(this);
        if (this.slip) {
            this.slip.detach();
        }
        this.attachSlip();
        this.attachSlipEvents();
    },
    attachSlip: function () {
        "use strict";
        this.slip_el = this.el.querySelector(this.slip_el_name);
        this.slip = new Slip(this.slip_el);
    },
    attachSlipEvents: function () {
        "use strict";
        var self = this;
        for (var key in this.slip_events) {
            if (this.slip_events.hasOwnProperty(key)) {
                if (this.disable_slip_events && this.disable_slip_events.indexOf(key) > -1) {
                    this.slip_events[key] = 'onPrevent';
                }
                (function (key) {
                    self.slip_el.addEventListener(key, function (e) {
                        self.callFunction(e, self.slip_events[key])
                    });
                })(key);
            }
        }
    },
    callFunction: function (e, callback) {
        "use strict";
        if (_.isFunction(this[callback])) {
            this[callback](e)
        }
    },
    onPrevent: function (e) {
        "use strict";
        e.preventDefault();
    }
});