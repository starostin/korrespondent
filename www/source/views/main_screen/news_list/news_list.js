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
    },
    openNewsList: function(){
        if(!this.el.classList.contains('open')) return;
        this.toggleSidebar();
    },

    onMoveVertically: function(e){
        var scrollView = this.el.querySelector('.native-scroll'),
            scrollPos = scrollView.scrollTop,
            scrollCoord = scrollView.getBoundingClientRect();

        if(scrollPos === 0 && !this.firstY){
            this.firstY = e.originalEvent.changedTouches[0].clientY;
        }
        if(scrollCoord.top <50){
            this.finished = true;
//            this.$el.find('.swipe-view').trigger('touchend');
//            this.$el.find('.swipe-view').trigger('touchstart');
            scrollView.classList.remove('stop-scrolling');
            return;
        }
        if(scrollPos >0){
            return;
        }

        var newY = e.originalEvent.changedTouches[0].clientY,
            diff =(newY - this.firstY);
        scrollView.classList.add('pull-active');
        scrollView.style.transition  = 'none';
        scrollView.classList.add('stop-scrolling');
        scrollView.style.transform = 'translateY(' + (diff*0.4)+ 'px)';
    },
    onTouchEnd: function(){
        console.log('-------------------------END------------------')
        this.firstY = null;
        var scrollView = this.el.querySelector('.native-scroll');
        scrollView.style.transition  = 'all 0.2s ease-in-out';
        scrollView.style.transform = 'translateY(0)';
        scrollView.classList.remove('stop-scrolling');

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