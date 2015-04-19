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
            'touchstart .one-news': 'touchStartSwipe',
            'touchmove .one-news': 'touchMoveSwipe',
            'touchend .one-news': 'touchEndSwipe'
        })
    },
    onInitialize: function(){
        var self = this;
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
        if(this.el.classList.contains('open') || this.directionVert) return;
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
            curTar.className = 'one-news';
            if(curTar.classList.contains('remove')){
                $(curTar).remove();
            }
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
            lang = this.settings.get('lang');

        RAD.utils.sql.getRows('SELECT * FROM news WHERE lang = "' + lang + '" AND newsId = "' + newsId + '"').then(function(oldNews){
            if(oldNews.length){
                var buffer = [],
                    news = [];
                for(var i=0; i<oldNews.length; i++){
                    if(oldNews[i].buffer){
                        buffer.push(oldNews[i])
                    }else{
                        news.push(oldNews[i])
                    }
                }
                self.news.reset(news);
                self.bufferNews.reset(buffer);
            }else{
                RAD.models.News.getNews({
                    error: function(){
                        self.showErrorMessage();
                    }
                }, function(data){
                    RAD.utils.sql.insertRows(data, 'news').then(function(){
                        self.news.reset(data);
                    });
                });
            }

        });

        if(subMenu.classList.contains('open')){
            subMenu.classList.remove('open');
        }
    },
    addNews: function(model, collection, opt){
        var li = document.createElement('li'),
            list = this.el.querySelector('.list'),
            firstLi = list.querySelector('li');
        li.className = 'one-news';
        li.setAttribute('data-cid', model.cid);
        li.innerHTML = '<img class="small-img" src="' + model.get('image') + '"/> ' +
            '<div class="news-title">' + model.get('title') + '</div>';
        if(firstLi){
            list.insertBefore(li, firstLi);
        }else{
            list.appendChild(li)
        }
    },
    addBufferNews: function(){
        if(this.el.classList.contains('open')) return;
        this.news.add(this.bufferNews.toJSON());
        this.bufferNews.reset();
        RAD.utils.sql.insertRows(this.news.toJSON(), 'news');
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

    onMoveVertically: function(e){
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            deg = 0;

        if(this.nativeScroll.scrollTop > 0 || this.el.classList.contains('open')){
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
    }
}));