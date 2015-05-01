RAD.service("service.check_news", RAD.Blanks.Service.extend({
    requestTime: 10 * 1000,
    onInitialize: function(){
        this.settings = RAD.models.Settings;
        this.settings.on('change:selectedSubCategory', this.immediateResetTracking, this);
        this.settings.on('change:lang', this.immediateResetTracking, this);
        this.resetTracking();
    },
    onReceiveMsg: function (channel, data) {
        var method = channel.split('.')[2],
            fn = this[method];
        if (typeof fn === 'function') {
            fn.call(this, data);
        } else {
            console.log('RAD.services.Track can`t find method ' + method);
        }
    },
    immediateResetTracking: function(model, val){
        if(val === 1000){
            this.stopTracking();
            return;
        }
        this.stopTracking();
        this.startTracking();
        RAD.models.News.setBufferNews({});
    },
    resetTracking: function(){
        this.stopTracking();
        this.startTracking();
    },
    startTracking: function(){
        var self = this;
        this.trackId = window.setTimeout(function(){
            self.startTracking();
            RAD.models.News.setBufferNews({});
        }, this.requestTime);
    },

    stopTracking: function(){
        clearTimeout(this.trackId);
    }
}));