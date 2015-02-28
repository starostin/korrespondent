RAD.view("view.sidebar_menu", RAD.views.SlipExt.extend({
    url: 'source/views/main_screen/sidebar_menu/sidebar_menu.html',
    slip_el_name: 'ul',
    className: 'menu-list',
    onBeforeWait: function(e){
        console.log('asdasdasd')
        var target = e.target;
        target.classList.add('active');
    },
    onTap: function(){
        console.log('-=-=-=-==--=-=-=-=')
    },
    onReorder: function (e) {
        console.log('-------------')
        var target = e.target,
            insertBefore = e.detail.insertBefore;
        target.classList.remove('active');
        target.parentNode.insertBefore(target, insertBefore);
        //this.setOrder();
    }
}));