RAD.view("view.sidebar_menu", RAD.views.SlipExt.extend({
    url: 'source/views/main_screen/sidebar_menu/sidebar_menu.html',
    events: {
        'touchstart li': 'onTouchStart',
        'touchend li': 'onTouchEnd',
        'tap li': 'openNewsListPage'
    },
    slip_el_name: 'ul',
    className: 'menu-list',
    onInitialize: function(){
      this.sidebar = RAD.models.Sidebar;
    },
    onTouchStart: function(e){
        var target = e.target;
        target.classList.add('active');
    },
    onTouchEnd: function(e){
        var target = e.target;
        target.classList.remove('active');
    },
    openNewsListPage: function(){
        document.querySelector('.main-list').classList.remove('open');
    },
    onReorder: function (e) {
        var target = e.target,
            insertBefore = e.detail.insertBefore;
        target.classList.remove('active');
        target.parentNode.insertBefore(target, insertBefore);
        //this.setOrder();
    }
}));