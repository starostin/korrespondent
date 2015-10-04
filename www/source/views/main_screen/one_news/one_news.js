RAD.view("view.one_news", RAD.views.SwipeExt.extend({
    url: 'source/views/main_screen/one_news/one_news.html',
    className: 'one-news-view',
    events: function(){
        return $.extend(RAD.views.SwipeExt.prototype.events, {
            'click .back': 'removeCurrentNews',
            'click .favorite': 'addNewsToFavorite',
            'click .font': 'toggleFontPopup',
            'click .font-small': 'makeSmallFont',
            'click .font-big': 'makeBigFont',
            'click .sharing': 'shareNews',
            'click a': 'openLink',
            'click': 'checkSidebar'
        })
    },
    onInitialize: function(){
        this.oneNews = new Backbone.Model;
        this.settings = RAD.models.Settings;
        this.settings.on('change:currentNews', this.showNews, this);
        this.settings.on('change:font', this.updateFont, this);
    },
    openLink: function(e){
        e.preventDefault();
        e.stopPropagation();
        if(!RAD.utils.checkConnection()){
           this.showErrorMessage();
            return;
        }
        var href = e.currentTarget.href;
        window.open(href, '_blank', 'location=yes');
    },
    showErrorMessage: function(){
        var errorDiv = this.el.querySelector('.message');
        errorDiv.classList.add('show');
        window.setTimeout(function(){
            errorDiv.classList.remove('show');
        }, 2000)
    },
    checkSidebar: function(){
        if(this.settings.get('sidebarOpen')){
            this.closeSidebar();
        }
    },
    closeSidebar: function(){
        this.settings.set('sidebarOpen', false);
    },
    toggleFontPopup: function(e){
        if(!e.target.classList.contains('font')) return;
        e.currentTarget.classList.toggle('show')
    },
    makeSmallFont: function(){
        var currentFont = this.settings.get('font');
        this.settings.set('font', currentFont - 2)
    },
    makeBigFont: function(){
        var currentFont = this.settings.get('font');
        this.settings.set('font', currentFont + 2)
    },
    updateFont: function(model, val){
        var textWrapper = this.el.querySelector('.par-text');
        textWrapper.style.fontSize = model.get('font') + 'px';
    },
    shareNews: function(){
        if(!window.cordova) {
            console.log('Share plugin use cordova');
            return;
        }
        window.plugins.socialsharing.share(this.oneNews.get('title'), null, null, this.oneNews.get('link'))
    },
    addNewsToFavorite: function(e){
        var curTar = e.currentTarget,
            isAdd = curTar.classList.contains('added') ? 0 : 1;
        curTar.classList.toggle('added');
        this.parentNews.set('favorite', isAdd);
    },
    setNews: function(){
        this.parentNews = RAD.models.News.get(this.settings.get('currentNews'));
        this.oneNews.set(this.parentNews.toJSON());
        this.render();
    },
    finishSwipe: function(val, half, direction){
        var isOpen = false;
        if(direction === 'right'){
            isOpen = true;
        }
        this.settings.set('sidebarOpen',  isOpen, {silent: true});
        this.settings.trigger('change:sidebarOpen');
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