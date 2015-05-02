RAD.view("view.sidebar_menu", RAD.views.SlipExt.extend({
    url: 'source/views/main_screen/sidebar_menu/sidebar_menu.html',
    events: {
        //'touchstart li': 'onTouchStart',
        //'touchend li': 'onTouchEnd',
        'tap li': 'openNewsListPage',
        'click .lang': 'changeLanguage',
        'click .support': 'sendFeedback'
    },
    slip_el_name: 'ul',
    className: 'sidebar-menu-view',
    onInitialize: function(){
        this.settings = RAD.models.Settings;
        this.sidebar = RAD.models.Sidebar;
        this.settings.on('change:lang', this.updateSidebarLanguage, this);
        this.settings.on('change:selectedCategory', this.updateSelectedOption, this);
        this.sidebar.on('change:selected', this.highlightSelected, this);
        RAD.models.FavotiteNews.on('add', this.updateFavoritesLength, this);
        RAD.models.FavotiteNews.on('remove', this.updateFavoritesLength, this);
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
            count = RAD.models.FavotiteNews.where({lang: lang}).length;
            favoriteSpan.setAttribute('data-count', count);
    },
    updateSidebarLanguage: function(){
        this.sidebar.resetWithOrder();
        this.render();
    },
    updateSelectedOption: function(model, val, opt){
        var oldSelected = this.sidebar.findWhere({selected: true}),
            oldSelectedSub = _.findWhere(oldSelected.get('subMenus'), {selected: true}),
            newSelected = this.sidebar.findWhere({id: val}),
            newSelectedSub = _.findWhere(newSelected.get('subMenus'), {id: val});
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
            id = +curTar.getAttribute('data-id');
        curTar.classList.add('selected');
        this.settings.set('selectedCategory', id);
        this.settings.set('selectedSubCategory', id);
        this.publish('view.news_list.toggleSidebar', null);
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