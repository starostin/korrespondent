RAD.view("view.news_list", RAD.views.ScrollSwipeExt.extend({
    url: 'source/views/main_screen/news_list/news_list.html',
    className: 'news-list-view',
    events: function(){
        return $.extend(RAD.views.ScrollSwipeExt.prototype.events, {
            'tap .news-topic': 'toggleSubMenu',
            'tap .sidebar-button': 'toggleSidebar',
            'tap .sub-menu-item': 'changeSubMenu',
            'tap .one-news': 'openNews',
            'tap .news-list': 'openNewsList'
        })
    },
    onInitialize: function(){
        this.rotateCoef = 180/50;
        this.sidebar = RAD.models.Sidebar;
        this.settings = RAD.models.Settings;
        this.news = RAD.models.News;
        this.bufferNews = RAD.models.BufferNews;
        this.settings.on('change:selectedSubCategory', this.setNews, this);
        this.settings.on('change:lang', this.setNews, this);
        this.news.on('reset', this.render, this);
        this.news.on('add', this.addNews, this);
        this.bufferNews.on('all', this.showUpdateMessage, this);
        $.extend(this.scrollOptions, {
            topOffset: 50,
            y: -50
        });
    },
    onStartAttach: function(){
        var viewCoord  = this.el.getBoundingClientRect();
        this.rightLineWidth = viewCoord.width * 0.9;
        this.halfWidth = viewCoord.width * 0.5;
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
    openNews: function(e){
        if(this.el.classList.contains('open')) return;
        var curTar = e.currentTarget,
            cid = curTar.getAttribute('data-cid');
        this.settings.set('currentNews', cid);
    },
    changeSubMenu: function(e){
        var curTar = e.currentTarget,
            newId = +curTar.getAttribute('data-id'),
            oldSelectedSub = _.findWhere(this.selected.get('subMenus'), {selected: true}),
            newSelectedSub = _.findWhere(this.selected.get('subMenus'), {id: newId});

        delete oldSelectedSub.selected;
        newSelectedSub.selected = true;
        this.settings.set('selectedSubCategory', newId);
    },
    setNews: function(model, val, option){
        var self = this,
            subMenu = this.el.querySelector('.sub-menu'),
            newsId = this.settings.get('selectedSubCategory'),
            lang = this.settings.get('lang'),
            identifier = lang + newsId,
            oldNews = JSON.parse(window.localStorage.getItem(identifier)) || [];
        this.bufferNews.reset();
        this.news.reset(oldNews);
        if(subMenu.classList.contains('open')){
            subMenu.classList.remove('open');
        }
    },
    addNews: function(model, collection, opt){
        var li = document.createElement('li'),
            list = this.el.querySelector('.list'),
            firstLi = list.querySelector('li');
        li.innerHTML = '<li class="one-news" data-cid="' + model.cid + '"> <img class="small-img" src="' + model.get('image') + '"/> ' +
            '<div class="news-title">' + model.get('title') + '</div> </li>';
        if(firstLi){
            list.insertBefore(li, firstLi);
        }else{
            list.appendChild(li)
        }
    },
    toggleSubMenu: function(e){
        var subMenu = this.el.querySelector('.sub-menu');
        subMenu.classList.toggle('open');
    },
    toggleSidebar: function(){
        this.el.classList.toggle('open');
//        this.mScroll.preventScroll = this.el.classList.contains('open');
    },
    openNewsList: function(){
        if(!this.el.classList.contains('open')) return;
        this.toggleSidebar();
    },
    onScrollMove: function(e){
        if(this.directionDefined && !this.directionVert){
            this.mScroll.preventScroll = true;
        }
        if(this.mScroll.y<-50){
            return;
        }
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            deg = Math.abs(this.rotateCoef * this.mScroll.y)-180;
        if(this.mScroll.y>0){
            deg = -180;
        }

        arrow.style.transform = 'rotate(' + deg + 'deg)';
        if(deg <= -180 && !pullDiv.classList.contains('update')){
            this.mScroll.minScrollY = 0;
            pullDiv.classList.add('update');
        }else if(!pullDiv.classList.contains('update')){
            this.mScroll.minScrollY = -50;
            pullDiv.classList.remove('update');
        }
    },
    finishSwipe: function(val, half){
        if(val >= half){
            this.el.classList.add('open');
        }else{
            this.el.classList.remove('open')
        }
    },
    getNews: function(){
        var self = this,
            pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            spinner = pullDiv.querySelector('.loader');
        arrow.style.display = 'none';
        spinner.style.display = '';
        this.bufferNews.reset();
        this.news.setNews({
            addBuffer: true,
            complete: function(){
                spinner.style.display = 'none';
                pullDiv.classList.remove('update');
                self.mScroll.refresh();
                arrow.style.display = '';
            },
            error: function(){
                self.showErrorMessage();
            }
        });
    },
    showUpdateMessage: function(model, collection, options){
        var updateMessage = this.el.querySelector('.update-message');
        if(!updateMessage) return;
        if(this.bufferNews.length){
            updateMessage.classList.add('show');
            updateMessage.setAttribute('data-count', this.bufferNews.length);
        }else {
            updateMessage.classList.remove('show');
        }
    },
    showErrorMessage: function(){
        var errorDiv = this.el.querySelector('.message');
        errorDiv.classList.add('show');
        window.setTimeout(function(){
            errorDiv.classList.remove('show');
        }, 2000)
    },
    onScrollEnd: function(){
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            isUpdate = pullDiv.classList.contains('update'),
            spinner = pullDiv.querySelector('.loader');
        if(isUpdate && spinner.style.display === 'none'){
            this.getNews();
        }
    }
}));