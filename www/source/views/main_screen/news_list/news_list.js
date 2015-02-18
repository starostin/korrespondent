RAD.view("view.news_list", RAD.Blanks.ScrollableView.extend({
    url: 'source/views/main_screen/news_list/news_list.html',
    scrollOptions: {
        useTransition: true,
        topOffset: 50
    }
}));