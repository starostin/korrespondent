RAD.view("view.news_list", RAD.views.SwipeExt.extend({
    url: 'source/views/main_screen/news_list/news_list.html',
    className: 'news-list-view',
    events: function(){
        return $.extend(RAD.views.SwipeExt.prototype.events, {
            'click .news-topic': 'toggleSubMenu',
            'click .sidebar-button': 'toggleSidebar',
            'click .sub-menu-item': 'changeSubMenu',
            'click .one-news': 'openNews',
            'click .news-list': 'openNewsList',
            'click .update-message': 'addBufferNews',
            'click .favorites-button': 'openFavorites',
            'touchstart .one-news': 'touchStartSwipe',
            'touchmove .one-news': 'touchMoveSwipe',
            'touchend .one-news': 'touchEndSwipe'
        })
    },
    onInitialize: function(){
        this.rotateCoef = 180/50;
        this.sidebar = RAD.models.Sidebar;
        this.settings = RAD.models.Settings;
        this.news = RAD.models.News;
        this.allNews = RAD.models.AllNews;
        this.settings.on('change:selectedSubCategory', this.setNews, this);
        this.settings.on('change:lang', this.setNews, this);
        this.news.on('reset', this.render, this);
        this.news.on('add', this.addNews, this);
        this.allNews.on('change:favorite', this.markFavorite, this);
        this.allNews.on('change:buffer', this.showUpdateMessage, this);
    },
    onStartAttach: function(){
        this.viewCoord  = this.el.getBoundingClientRect();
        this.rightLineWidth = this.viewCoord.width * 0.9;
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
    touchStartSwipe: function(e){
        this.startItemCoord = e.currentTarget.getBoundingClientRect();
        this.startX = Math.abs(this.startItemCoord.left) + e.originalEvent.changedTouches[0].clientX;
    },
    touchMoveSwipe: function(e){
        if(this.el.classList.contains('open') || this.directionVert || !this.el.classList.contains('favorites-list')) return;
        var curTar = e.currentTarget,
            diff = this.startX - e.originalEvent.changedTouches[0].clientX;
        if(diff<0){
            diff=0;
        }
        curTar.style.transform = 'translateX(' + (-diff) + 'px)'
    },
    touchEndSwipe: function(e){
        var curTar = e.currentTarget,
            tr = curTar.style.transform,
            cid = curTar.getAttribute('data-cid'),
            model = this.news.get(cid),
            value = 0;
        if(!tr){
            return;
        }

        value = tr.split('(')[1];
        value = Math.abs(parseInt(value.split(')')[0]));
        if(!value){
            curTar.style.transition = 'none';
            curTar.style.transform = 'translateX(0px)';
            curTar.className = 'one-news';
            return;
        }
        curTar.style.transition = 'all 0.3s ease-in-out';
        if(value >= this.viewCoord.width/2){
            curTar.classList.add('remove')
        }else{
            curTar.classList.add('stay')
        }
        function endTransition(){
            curTar.style.transition = 'none';
            curTar.style.transform = 'translateX(0px)';
            if(curTar.classList.contains('remove')){
                model.set('favorite', '');
            }
            curTar.className = 'one-news';
        }
        curTar.addEventListener('webkittransitionend', endTransition);
        curTar.addEventListener('transitionend', endTransition);
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
            currentNews = RAD.models.AllNews.where({lang: lang, newsId: newsId});
        this.el.classList.remove('favorites-list');
        if(newsId === 1000){
            self.resetByFavorites();
            return;
        }
        if(currentNews.length){
            self.news.reset(currentNews);
            self.publish('service.check_news.immediateResetTracking');
        }else{
            RAD.models.News.getNews({
                error: function(){
                    self.news.reset();
                    self.publish('service.check_news.immediateResetTracking');
                    self.showErrorMessage();
                }
            }, function(data){
                RAD.utils.sql.insertRows(data, 'news').then(function(){
                    self.news.reset(data);
                    RAD.models.AllNews.add(data);
                    self.publish('service.check_news.immediateResetTracking');
                });
                RAD.models.News.downloadImages(data).then(function(schemas){
                    RAD.utils.sql.insertRows(schemas, 'news')
                })
            });
        }

        if(subMenu.classList.contains('open')){
            subMenu.classList.remove('open');
        }
    },
    addNews: function(model, collection, opt){
        if(model.get('buffer')){
            this.showUpdateMessage();
            return;
        }
        var li = document.createElement('li'),
            list = this.el.querySelector('.list'),
            firstLi = list.querySelector('li');
        li.className = 'one-news';
        li.setAttribute('data-cid', model.cid);
        li.innerHTML = '<img class="small-img" src="' + (model.get('imagesNativeURL') ||model.get('image')) + '"/> ' +
            '<div class="news-title">' + model.get('title') + '</div>' +
            '<div class="favorite-news hide" ></div>';
        if(firstLi){
            list.insertBefore(li, firstLi);
        }else{
            list.appendChild(li)
        }
    },
    addBufferNews: function(){
        if(this.el.classList.contains('open')) return;
        var newsId = this.settings.get('selectedSubCategory'),
            lang = this.settings.get('lang'),
            bufferNews = this.allNews.where({lang: lang, newsId: newsId, buffer: 1});
        for(var i=0; i<bufferNews.length; i++){
            bufferNews[i].set('buffer', 0);
        }
        this.news.add(bufferNews);
        RAD.utils.sql.insertRows(bufferNews, 'news');
    },
    toggleSubMenu: function(e){
        var subMenu = this.el.querySelector('.sub-menu');
        subMenu.classList.toggle('open');
    },
    toggleSidebar: function(){
        this.el.classList.toggle('open');
        this.el.classList.contains('open') ? this.nativeScroll.classList.add('stop-scrolling') : this.nativeScroll.classList.remove('stop-scrolling');
    },
    openNewsList: function(){
        if(!this.el.classList.contains('open')) return;
        this.toggleSidebar();
    },
    openFavorites: function(){
        this.publish('view.favorites.toggleView')
    },
    resetByFavorites: function(){
        var self = this,
            lang = this.settings.get('lang');
            self.news.reset(RAD.models.AllNews.where({lang: lang, favorite: 1}));
        this.el.classList.add('favorites-list');
    },
    markFavorite: function(model, val, options){
        var li = this.el.querySelector('[data-cid="' + model.cid + '"]');
        if(this.el.classList.contains('favorites-list')){
            val ? this.addNews(model) : $(li).remove();
        }
        var  newLi = this.el.querySelector('[data-cid="' + model.cid + '"]');
        if(!newLi) return;
        var favoriteIcon = newLi.querySelector('.favorite-news');
        val ? favoriteIcon.classList.remove('hide') : favoriteIcon.classList.add('hide');

    },
    onMoveVertically: function(e){
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            deg = 0;

        if(this.nativeScroll.scrollTop > 0 || this.el.classList.contains('open') || this.el.classList.contains('favorites-list')){
            return;
        }

        var firstY = this.coordinates.y[this.coordinates.y.length-1],
            newY = e.originalEvent.changedTouches[0].clientY,
            diff =(newY - firstY);
        if(diff>0){
            this.nativeScroll.classList.add('stop-scrolling');
        }else{
            this.nativeScroll.classList.remove('stop-scrolling');
            return;
        }
        this.nativeScroll.style.transition  = 'none';
        this.nativeScroll.style.transform = 'translateY(' + (this.startScrollCoord.top + diff*0.4)+ 'px)';

        deg = Math.abs(this.rotateCoef * diff)-180;

        arrow.style.transform = 'rotate(' + deg + 'deg)';
        if(diff >=50){
            pullDiv.classList.add('update');
        }else if(!pullDiv.classList.contains('update')){
            pullDiv.classList.remove('update');
        }
    },
    onTouchEnd: function(){
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            isUpdate = pullDiv.classList.contains('update'),
            spinner = pullDiv.querySelector('.loader');
        if(!this.el.classList.contains('open')){
            this.nativeScroll.classList.remove('stop-scrolling');
        }
        this.nativeScroll.style.transition  = 'all 0.2s ease-in-out';
        this.nativeScroll.style.transform = 'translateY(0)';
        if(isUpdate){
            this.getNews();
        }
    },
    finishSwipe: function(val, half){
        val >= half ? this.el.classList.add('open') : this.el.classList.remove('open');
        val >= half ? this.nativeScroll.classList.add('stop-scrolling') : this.nativeScroll.classList.remove('stop-scrolling');
    },
    getNews: function(){
        var self = this,
            pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            spinner = pullDiv.querySelector('.loader');
        arrow.style.display = 'none';
        spinner.style.display = '';
        this.nativeScroll.style.transform = 'translateY(50px)';
        window.setTimeout(function(){
            RAD.models.News.getNews({
                error: function(){
                    removeSpinner();
                    self.addBufferNews();
                    self.showErrorMessage();
                }
            }, function(data){
                removeSpinner();
                self.addBufferNews();
                self.news.add(data);
                RAD.utils.sql.insertRows(data, 'news');
                RAD.models.News.downloadImages(data).then(function(schemas){
                    RAD.utils.sql.insertRows(schemas, 'news')
                })
            });
        }, 1000);

        function removeSpinner(){
            self.nativeScroll.style.transform = 'translateY(0)';
            spinner.style.display = 'none';
            pullDiv.classList.remove('update');
            arrow.style.display = '';
        }
    },
    showUpdateMessage: function(model, collection, options){
        var updateMessage = this.el.querySelector('.update-message'),
            newsId = this.settings.get('selectedSubCategory'),
            lang = this.settings.get('lang'),
            bufferNews = this.allNews.where({lang: lang, newsId: newsId, buffer: 1});
        if(!updateMessage) return;
        if(bufferNews.length){
            updateMessage.classList.add('show');
            updateMessage.setAttribute('data-count', bufferNews.length);
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
    }
}));