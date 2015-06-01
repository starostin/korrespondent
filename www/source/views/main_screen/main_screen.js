RAD.view("view.main_screen", RAD.Blanks.View.extend({
    url: 'source/views/main_screen/main_screen.html',
    children: [
        {
            container_id: '#sidebar-menu',
            content: 'view.sidebar_menu'
        },
        {
            container_id: '#news-list',
            content: 'view.news_list'
        },
        {
            container_id: '#favorites',
            content: 'view.favorites'
        },
        {
            container_id: '#one-news',
            content: 'view.one_news'
        }
    ]
}));