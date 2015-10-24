RAD.view("view.sidebar_menu", RAD.views.SlipExt.extend({
    url: 'source/views/main_screen/sidebar_menu/sidebar_menu.html',
    events: function(){
        return $.extend(RAD.views.SwipeExt.prototype.events, {
            'click li': 'openNewsListPage',
            'click .lang': 'changeLanguage',
            'click .support': 'sendFeedback',
            'transitionend ': 'sidebarTransitionEnd'
        })
    },
    slip_el_name: 'ul',
    className: 'sidebar-menu-view animated',
    toggleMenu: function(){
        this.settings.set('sidebarOpen', !this.settings.get('sidebarOpen'));
    },
    setSidebarOpen: function(){
        this.el.style.transform = 'translateX(0)';
        this.el.style.webkitTransform = 'translateX(0)';
        this.settings.set('sidebarOffset', this.width)
    },
    setSidebarClose: function(){
        this.el.style.transform = 'translateX(-100%)';
        this.el.style.webkitTransform = 'translateX(-100%)';
        this.settings.set('sidebarOffset', 0);
    },
    onInitialize: function(){
        var self = this;
        this.settings = RAD.models.Settings;
        this.sidebar = RAD.models.Sidebar;
        this.allNews = RAD.models.AllNews;
        this.allNews.on('add', this.updateNewsLength, this);
        this.allNews.on('change:buffer', this.updateNewsLength, this);
        this.settings.on('change:lang', this.updateSidebarLanguage, this);
        this.settings.on('change:selectedSubCategory', this.updateSelectedOption, this);
        this.settings.on('change:sidebarOpen', this.toggleSidebar, this);
        this.settings.on('change:sidebarOffset', this.changeShadow, this);
        this.settings.on('change:newsListRendered', function(){
            self.settings.set('sidebarOpen', false);
        }, this);
        this.sidebar.on('change:selected', this.highlightSelected, this);
        this.allNews.on('change:favorite', this.updateFavoritesLength, this);
    },
    sidebarTransitionEnd: function(){
        if(!this.settings.get('sidebarOffset')){
            this.settings.set('shadowState', 'hideShadow');
        }
    },
    changeShadow: function(){
        this.settings.set('shadow', this.getShadowPercent());
    },
    getShadowPercent: function(){
        var percentSide = this.settings.get('sidebarOffset') / (this.width || 1);
        return percentSide * 0.7;
    },
    onStartAttach: function(){
        this.width = this.$el.width();
    },
    onReceiveMsg: function(channel, data){
        var parts = channel.split('.'),
            method = parts[2];
        if(typeof this[method] === 'function'){
            this[method](data)
        }else{
            console.log('view.sidebar_menu does not have method '+ method)
        }
    },
    onSwipeTouchEnd: function(){
        this.settings.set('shadowState', 'addShadowAnimation');
    },
    onMoveRight: function(data){
        var val = _.isNumber(data) ? data : data.value;
        if(+val>this.width){
            val = this.width;
        }
        var diff = -this.width + (+val);

        if(this.settings.get('sidebarOpen')){
            diff = (val);
        }
        if(diff >0){
            diff = 0;
        }
        this.settings.set('shadowState', 'removeShadowAnimation');
        this.el.classList.remove('animated');
        this.el.style.transform = 'translateX(' + diff + 'px)';
        this.el.style.webkitTransform = 'translateX(' + diff + 'px)';
        this.settings.set('sidebarOffset', this.width + diff)
    },
    onMoveLeft: function(data){
        var val = _.isNumber(data) ? data : data.value;
        if(+val>this.width){
            val = this.width;
        }
        var diff = -this.width + (+val);

        if(this.settings.get('sidebarOpen')){
            diff = (val);
        }
        if(diff >0){
            diff = 0;
        }
        this.settings.set('shadowState', 'removeShadowAnimation');
        this.el.classList.remove('animated');
        this.el.style.transform = 'translateX(' + diff + 'px)';
        this.el.style.webkitTransform = 'translateX(' + diff + 'px)';
        this.settings.set('sidebarOffset', this.width + diff)
    },
    finishSwipe: function(val, half, direction){
        var isOpen = false;
        if(direction === 'right'){
            isOpen = true;
        }
        this.settings.set('sidebarOpen',  isOpen, {silent: true});
        this.settings.trigger('change:sidebarOpen');
    },
    sendFeedback: function(e){
        if(!window.cordova) {
            console.log('Email plugin use cordova');
            return;
        }

        cordova.plugins.email.addAlias('gmail', 'com.google.android.gm');
        cordova.plugins.email.open({
            app: 'gmail',
            to:      'korrespondent.android@gmail.com',
            subject: 'Korrespondent Feedback',
            body:    '<em>Напишите Ваши пожелания или расскажите о ' +
            'проблеме - нам это очень важно. Спасибо!</em><br> <em>Android ' + device.version + ', </em><br>' +
            '<em>Версия приложения ' + settings.version + '</em><br><br><p>Отправлено с ' + device.model + '</p>',
            isHtml:  true
        })
    },
    updateFavoritesLength: function(){
        var favoriteSpan = this.el.querySelector('.favorite-item'),
            lang = this.settings.get('lang'),
            favorites = this.allNews.where({lang: lang, favorite: 1});
            favoriteSpan.setAttribute('data-count', favorites.length || '');
    },
    getUniqueNews: function(news){
        var  uniqueNews = [];
        for(var i=0; i<news.length; i++){
            if(uniqueNews.indexOf(news[i].get('guid')) == -1){
                uniqueNews.push(news[i].get('guid'))
            }
        }
        return uniqueNews;
    },
    updateNewsLength: function(model, col, opt){
        var li = this.el.querySelector('[data-id="' + model.get('parentId') + '"]'),
            countSpan = li.querySelector('.count'),
            lang = this.settings.get('lang'),
            news = this.allNews.where({lang: lang, parentId: model.get('parentId'), buffer: 0});

        countSpan.setAttribute('data-count', this.getUniqueNews(news).length || '');
    },
    updateSidebarLanguage: function(){
        this.sidebar.resetWithOrder();
        this.render();
    },
    updateSelectedOption: function(model, val, opt){
        var oldSelected = this.sidebar.findWhere({selected: true}),
            oldSelectedSub = _.findWhere(oldSelected.get('subMenus'), {selected: true}),
            newSelected = this.sidebar.findWhere({id: model.get('selectedCategory')}),
            newSelectedSub = _.findWhere(newSelected.get('subMenus'), {id: model.get('selectedSubCategory')});
        oldSelected.unset('selected');
        newSelected.set('selected', true);
        delete oldSelectedSub.selected;
        newSelectedSub.selected = true;
    },
    highlightSelected: function(model, val, opt){
        var id = model.get('id'),
            option = this.el.querySelector('[data-id="' + id + '"]');
        val ? option.classList.add('selected') : option.classList.remove('selected');
    },
    changeLanguage: function(e){
        var needLang = this.settings.get('lang') === 'rus' ? 'ukr' : 'rus';
        this.settings.set('lang', needLang);
    },
    onTouchStart: function(e){
        var target = e.target;
        target.classList.add('active');
    },
    onTouchEnd: function(e){
        var target = e.target;
        target.classList.remove('active');
    },
    openNewsListPage: function(e){
        var curTar = e.currentTarget,
            id = +curTar.getAttribute('data-id'),
            previousId = this.settings.get('selectedCategory');
        curTar.classList.add('selected');
        this.settings.set('selectedCategory', id);
        this.settings.set('selectedSubCategory', id);
        this.settings.unset('currentNews');
        if(previousId === id){
            this.settings.set('sidebarOpen', !this.settings.get('sidebarOpen'));
        }
        //this.settings.set('sidebarOpen', !this.settings.get('sidebarOpen'));
    },
    toggleSidebar: function(){
        this.el.classList.add('animated');
        var isOpen = this.settings.get('sidebarOpen');
        isOpen ? this.setSidebarOpen() : this.setSidebarClose();
    },
    onReorder: function (e) {
        var target = e.target,
            insertBefore = e.detail.insertBefore;
        target.classList.remove('active');
        target.parentNode.insertBefore(target, insertBefore);
        this.setOrder();
    },
    setOrder: function(){
        var items = this.el.querySelectorAll('li'),
            sortArr = [];
        for(var i=0; i<items.length; i++){
            sortArr.push(+items[i].getAttribute('data-id'));
        }
        window.localStorage.setItem('sidebarOptionsOrder', JSON.stringify(sortArr))
    }
}));
