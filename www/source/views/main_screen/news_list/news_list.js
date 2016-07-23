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
            'click .shadow': 'toggleSidebar',
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
        this.settings.on('change:sidebarOpen', this.toggleScrollEnable, this);
        this.settings.on('change:shadow', this.changeShadow, this);
        this.settings.on('change:shadowState', this.changeShadowState, this);
        this.settings.on('change:currentNews', this.makeNewsViewed, this);
        this.news.on('reset', this.render, this);
        this.news.on('add', this.addNews, this);
        this.news.on('change:buffer', this.showUpdateMessage, this);
        this.news.on('change:favorite', this.markFavorite, this);
        this.news.on('change:viewed', this.changeNewsState, this);
    },
    onStartAttach: function(){
        this.viewCoord  = this.el.getBoundingClientRect();
        this.rightLineWidth = this.viewCoord.width * 0.9;
        if(this.settings.get('selectedCategory') === 1000){
            this.el.classList.add('favorites-list');
        }
    },
    onStartRender: function(){
        this.selected = this.sidebar.findWhere({selected: true});
    },
    onEndRender: function(){
        var self = this;
        if(!this.news.length && this.settings.get('selectedCategory') !== 1000){
            window.setTimeout(function(e){
                self.showErrorMessage();
            }, 50)
        }
        this.settings.set('newsListRendered', +new Date(), {langChanged: this.langChanged});
    },
    makeNewsViewed: function(model, val){
        if(!val) return;
        this.news.get(val).set('viewed', 1);
    },
    changeNewsState: function(model){
        var li = this.el.querySelector('[data-cid="' + model.cid + '"]');
        li.classList.add('viewed');
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
    changeShadowState: function(model, val){
        if(this[val]){
            this[val]();
        }
    },
    hideShadow: function(){
        var shadowEl = this.el.querySelector('.shadow');
        shadowEl.classList.add('hide');
    },
    removeShadowAnimation: function(){
        var shadowEl = this.el.querySelector('.shadow');
        shadowEl.classList.remove('animated');
    },
    addShadowAnimation: function(){
        var shadowEl = this.el.querySelector('.shadow');
        shadowEl.classList.add('animated');
    },
    changeShadow: function(model, val){
        var shadowEl = this.el.querySelector('.shadow');
        shadowEl.classList.remove('hide');
        shadowEl.offsetWidth;
        shadowEl.style.opacity = val;

    },
    closeSidebar: function(){
        this.settings.set('sidebarOpen', false);
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
            model.get('viewed') && curTar.classList.add('viewed');
        }
        curTar.addEventListener('webkittransitionend', endTransition);
        curTar.addEventListener('transitionend', endTransition);
    },
    openNews: function(e){
        if(this.settings.get('sidebarOpen')){
            this.closeSidebar();
            return;
        }
        var curTar = e.currentTarget,
            cid = curTar.getAttribute('data-cid');
        this.settings.set('currentNews', cid);
    },
    changeSubMenu: function(e){
        var self = this,
            curTar = e.currentTarget,
            newId = +curTar.getAttribute('data-id'),
            oldSelectedSub = _.findWhere(this.selected.get('subMenus'), {selected: true}),
            newSelectedSub = _.findWhere(this.selected.get('subMenus'), {id: newId});

        delete oldSelectedSub.selected;
        newSelectedSub.selected = true;
       this.toggleSubMenu();
        window.setTimeout(function(){
            self.settings.set('selectedSubCategory', newId);
        }, 300);
    },
    setNews: function(model, val, option){
        var self = this,
            subMenu = this.el.querySelector('.sub-menu'),
            newsId = this.settings.get('selectedSubCategory'),
            lang = this.settings.get('lang'),
            currentNews = RAD.models.AllNews.where({lang: lang, newsId: newsId});
        this.el.classList.remove('favorites-list');
        this.langChanged = false;
        if(newsId === 1000){
            self.publish('service.check_news.stopTracking');
            self.resetByFavorites();
            return;
        }
        if(Object.keys(RAD.languages).indexOf(val) !== -1){
            this.langChanged = true;
        }
        if(currentNews.length){
            self.news.reset(currentNews);
        }else{
            RAD.models.News.getNews({
                error: function(e){
                    self.news.reset();
                    self.showErrorMessage({
                        status: e.status,
                        message: e.statusText
                    });
                }
            }, function(data){
                RAD.utils.sql.insertRows(data, 'news').then(function(){
                    self.news.reset(data);
                    RAD.models.AllNews.add(data);
                });
                RAD.models.News.downloadImages(data)
            });
        }
        self.publish('service.check_news.immediateResetTracking');

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
            firstLi = list.querySelector('li'),
            path = model.get('imageDownloaded') ? settings.rootPath + settings.image + '/' + model.get('imageName') : model.get('image');
        li.className = 'one-news';
        li.setAttribute('data-cid', model.cid);

        li.innerHTML = '<div class="news-date">' + RAD.utils.formatDate(model.get("pubDate"), "dd mmmm yyyy | HH:MM") + '</div>' +
        '<div class="small-img"> <div class="small-img-placeholder" ' +
            'style="background-image: url(' + path + ')"></div></div>' +
            '<div class="news-title">' + model.get('title') + '</div>' +
            '<div class="news-description">' + model.get('description') + '</div>' +
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
            newsArr = [],
            bufferNews = this.news.where({lang: lang, newsId: newsId, buffer: 1});
        for(var i=0; i<bufferNews.length; i++){
            bufferNews[i].set('buffer', 0);
            RAD.models.AllNews.get(bufferNews[i].id).set('buffer', 0);
            newsArr.push(bufferNews[i].toJSON())
        }
        this.nativeScroll.scrollTop = 0;
        RAD.utils.sql.insertRows(newsArr, 'news');
    },
    toggleSubMenu: function(e){
        var subMenu = this.el.querySelector('.sub-menu'),
            subMenuArrow = this.el.querySelector('.news-topic span');
        subMenu.classList.toggle('open');
        if (!subMenuArrow) return;
        if(subMenu.classList.contains('open')){
            subMenuArrow.innerHTML = '&#9650'
        }else{
            subMenuArrow.innerHTML = '&#9660'
        }
    },
    toggleSidebar: function(){
        this.settings.set('sidebarOpen', !this.settings.get('sidebarOpen'));
    },
    openNewsList: function(){
        //if(!this.el.classList.contains('open')) return;
        //this.toggleSidebar();
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
    scrollUp: function(top){
        var header = this.el.querySelector('.header-wrapper');
        header.classList.remove('hidden');
    },
    scrollDown: function(top){
        if(top<50) return;
        var header = this.el.querySelector('.header-wrapper');
        header.classList.add('hidden');
    },
    onMoveVertically: function(e){
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            refreshDiv = this.el.querySelector('.refresh'),
            deg = 0;

        if(this.nativeScroll.scrollTop > 0 || this.el.classList.contains('open') || this.el.classList.contains('favorites-list') ||
            this.settings.get('sidebarOpen') || pullDiv.classList.contains('update')){
            return;
        }

        var firstY = this.firstY,
            newY = e.originalEvent.changedTouches[0].clientY,
            diff =(newY - firstY);
        if(diff>0){
            this.nativeScroll.classList.add('stop-scrolling');
        }else{
            this.nativeScroll.classList.remove('stop-scrolling');
            return;
        }
        refreshDiv.style.width = diff * this.rotateCoef + 'px';
        if(parseInt(refreshDiv.style.width) >= this.viewCoord.width){
            pullDiv.classList.add('update');
            this.getNews();
        }else{
            pullDiv.classList.remove('update');
        }
        if (diff >= 15) {
            diff = 15;
        }
        this.nativeScroll.style.transition  = 'none';
        this.nativeScroll.style.transform = 'translateY(' + (this.startScrollCoord.top + diff)+ 'px)';

//        deg = Math.abs(this.rotateCoef * diff)-180;

//        if(arrow){
//            arrow.style.transform = 'rotate(' + deg + 'deg)';
//        }
//
//        if(diff >=50){
//            pullDiv.classList.add('update');
//        }else if(!pullDiv.classList.contains('update')){
//            pullDiv.classList.remove('update');
//        }
    },
    onSwipeTouchEnd: function(){
        var self = this,
            pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            isUpdate = pullDiv.classList.contains('update');

        this.addShadowAnimation();
        if(isUpdate){
            this.getNews();
        }else{
            this.nativeScroll.style.transition  = 'all 0.2s ease-in-out';
            this.nativeScroll.style.transform = 'translateY(0)';
        }
    },
    toggleScrollEnable: function(){
        var isOpen = this.settings.get('sidebarOpen');
        isOpen ? this.nativeScroll.classList.add('stop-scrolling') : this.nativeScroll.classList.remove('stop-scrolling');
    },
    getNews: function(){
        var self = this,
            pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            spinner = pullDiv.querySelector('.refresh');
        if(spinner.classList.contains('loader')) return;

        if (arrow) arrow.style.display = 'none';
        if (spinner) spinner.style.display = '';
        spinner.classList.add('loader');
        spinner.style.width = '';
        this.nativeScroll.style.transform = 'translateY(15px)';
        window.setTimeout(function(){
            RAD.models.News.getNews({
                error: function(e){
                    removeSpinner();
                    self.addBufferNews();
                    self.showErrorMessage({
                        status: e.status,
                        message: e.statusText
                    });
                }
            }, function(data){
                removeSpinner();
                self.addBufferNews();
                self.news.add(data);
                RAD.utils.sql.insertRows(data, 'news');
                RAD.models.News.downloadImages(data)
            });
        }, 2000);

        function removeSpinner(){
            window.setTimeout(function(){
                spinner.classList.remove('loader');
                pullDiv.classList.remove('update');
                if (arrow) arrow.style.display = '';
            }, 200);
            self.nativeScroll.style.transition  = 'all 0.2s ease-in-out';
            self.nativeScroll.style.transform = 'translateY(0)';
        }
    },
    showUpdateMessage: function(model){
        if(model && !model.get('buffer')){
            this.addNews(model);
            //return;
        }
        var updateMessage = this.el.querySelector('.update-message'),
            newsId = this.settings.get('selectedSubCategory'),
            lang = this.settings.get('lang'),
            bufferNews = this.news.where({newsId: newsId, buffer: 1, lang: lang});
        if(!updateMessage) return;
        if(bufferNews.length){
            updateMessage.classList.add('show');
            updateMessage.setAttribute('data-count', bufferNews.length);
        }else {
            updateMessage.classList.remove('show');
        }
    },
    showErrorMessage: function(opt){
        var errorDiv = this.el.querySelector('.message');
        errorDiv.innerHTML = (opt && opt.status) ? (opt.status + ' ' + opt.message) : RAD.utils.Dictionary('Отсутствует интернет соединение');
        errorDiv.classList.add('show');
        window.setTimeout(function(){
            errorDiv.classList.remove('show');
        }, 2000)
    },
    onMoveLeft: function(diff){
        if(this.coordinates.x && this.coordinates.x[0] > 10) return;
        this.publish('view.sidebar_menu.onMoveLeft', {
            value: diff
        });
    },
    onMoveRight: function(diff){
        if(this.coordinates.x && this.coordinates.x[0] > 10) return;
        this.publish('view.sidebar_menu.onMoveRight', {
            value: diff
        });
    },
    finishSwipe: function(val, half, direction){
        if(this.coordinates.x && this.coordinates.x[0] > 10) return;
        var isOpen = false;
        if(direction === 'right'){
            isOpen = true;
        }
        this.settings.set('sidebarOpen',  isOpen, {silent: true});
        this.settings.trigger('change:sidebarOpen');
    }
}));