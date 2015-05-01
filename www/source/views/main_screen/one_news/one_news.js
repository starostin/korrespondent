RAD.view("view.one_news", RAD.views.SwipeExt.extend({
    url: 'source/views/main_screen/one_news/one_news.html',
    className: 'one-news-view',
    events: function(){
        return $.extend(RAD.views.SwipeExt.prototype.events, {
            'click .back': 'removeCurrentNews',
            'click .favorite': 'addNewsToFavorite'
        })
    },
    onInitialize: function(){
        this.oneNews = new Backbone.Model;
        this.settings = RAD.models.Settings;
        this.settings.on('change:currentNews', this.showNews, this)
    },
    addNewsToFavorite: function(e){
        var curTar = e.currentTarget,
            isAdd = curTar.classList.contains('added') ? '' : true;
        curTar.classList.toggle('added');
        this.parentNews.set('favorite', isAdd);
    },
    setNews: function(){
       this.parentNews = RAD.models.News.get(this.settings.get('currentNews'));
        this.oneNews.set(this.parentNews.toJSON());
        this.render();
    },
    finishSwipe: function(val, half){
        if(val < half){
            this.el.classList.add('open');
        }else{
            this.el.classList.remove('open');
            this.removeCurrentNews();
        }
    },
    showNews: function(model, val, option){
        if(!val){
            this.el.classList.remove('open')
        }else{
            this.setNews();
            this.el.classList.add('open');
        }
    },
    removeCurrentNews: function(){
        this.settings.unset('currentNews');
    }
}));