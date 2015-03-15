RAD.view("view.one_news", RAD.views.ScrollSwipeExt.extend({
    url: 'source/views/main_screen/one_news/one_news.html',
    className: 'one-news-view',
    events: function(){
        return $.extend(RAD.views.ScrollSwipeExt.prototype.events, {
            'tap .back': 'removeCurrentNews'
        })
    },
    onInitialize: function(){
        this.news = {};
        this.settings = RAD.models.Settings;
        this.settings.on('change:currentNews', this.showNews, this)
    },
    onStartRender: function(){
        this.news = this.settings.get('currentNews') ? RAD.models.News.get(this.settings.get('currentNews')).toJSON() : {};
    },
    finishSwipe: function(val, half){
        if(val < half){
            this.el.classList.add('open');
        }else{
            this.el.classList.remove('open')
        }
    },
    showNews: function(model, val, option){
        if(!val){
            this.el.classList.remove('open')
        }else{
            this.el.classList.add('open');
            this.render();
        }
    },
    removeCurrentNews: function(){
        this.settings.unset('currentNews');
    }
}));