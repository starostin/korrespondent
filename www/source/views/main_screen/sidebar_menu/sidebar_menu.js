RAD.view("view.sidebar_menu", RAD.views.SlipExt.extend({
    url: 'source/views/main_screen/sidebar_menu/sidebar_menu.html',
    events: {
        'touchstart li': 'onTouchStart',
        'touchend li': 'onTouchEnd',
        'tap li': 'openNewsListPage',
        'tap .lang': 'changeLanguage'
    },
    slip_el_name: 'ul',
    className: 'menu-list',
    onInitialize: function(){
        this.settings = RAD.models.Settings;
        this.sidebar = RAD.models.Sidebar;
        this.settings.on('change:lang', this.updateSidebarLanguage, this);
        this.settings.on('change:selectedCategory', this.updateSelectedOption, this);
        this.sidebar.on('change:selected', this.highlightSelected, this)
    },
    updateSidebarLanguage: function(){
        this.sidebar.resetWithOrder();
        this.render();
    },
    updateSelectedOption: function(model, val, opt){
        var selected = this.sidebar.findWhere({selected: true}),
            newSelected = this.sidebar.findWhere({id: val});
        selected.unset('selected');
        newSelected.set('selected', true);
        window.localStorage.setItem('selectedCategory', val);
        this.publish('view.news_list.changeCategory', null);
    },
    highlightSelected: function(model, val, opt){
        var id = model.get('id'),
            option = this.el.querySelector('[data-id="' + id + '"]');
        val ? option.classList.add('selected') : option.classList.remove('selected');
    },
    changeLanguage: function(e){
        var needLang = this.settings.get('lang') === 'rus' ? 'ukr' : 'rus';
        this.settings.set('lang', needLang);
        window.localStorage.setItem('lang', needLang);
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

        document.querySelector('.main-list').classList.remove('open');
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