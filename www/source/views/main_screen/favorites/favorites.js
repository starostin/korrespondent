RAD.view("view.favorites", RAD.views.SwipeExt.extend({
    url: 'source/views/main_screen/favorites/favorites.html',
    className: 'favorites-view',
    events: function(){
        return $.extend(RAD.views.SwipeExt.prototype.events, {
            'click .back-button': 'toggleView',
            'click .one-news': 'openNews'
        })
    },
    onInitialize: function(){
        var self = this;
        this.sidebar = RAD.models.Sidebar;
        this.settings = RAD.models.Settings;
        this.news = RAD.models.News;
        this.bufferNews = RAD.models.BufferNews;
    },
    onStartAttach: function(){
        var viewCoord  = this.el.getBoundingClientRect();
        this.rightLineWidth = viewCoord.width * 0.9;
    },
    onStartRender: function(){
        this.selected = this.sidebar.findWhere({selected: true});
    },
    onReceiveMsg: function(channel, data){
        var parts = channel.split('.'),
            method = parts[2];
        if(typeof this[method] === 'function'){
            this[method](data)
        }else{
            console.log('view.news_list does not have method '+ method)
        }
    },
    toggleView: function(){
        this.el.classList.toggle('open');
    },
    openNews: function(e){
        if(this.el.classList.contains('open')) return;
        var curTar = e.currentTarget,
            cid = curTar.getAttribute('data-cid');
        this.settings.set('currentNews', cid);
    },
    finishSwipe: function(val, half){
        if(val < half){
            this.el.classList.add('open');
        }else{
            this.el.classList.remove('open');
        }
    }
}));