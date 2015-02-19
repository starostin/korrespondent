RAD.view("view.news_list", RAD.Blanks.View.extend({
    url: 'source/views/main_screen/news_list/news_list.html',
    onattach: function(){
        var self = this,
            wrapper = this.el.querySelector('.scroll-view');
        this.mScroll = new iScroll(wrapper, {
            useTransition: true,
            hScrollbar: false,
            vScrollbar: false,
            topOffset: 50,
            y: -50,
            onRefresh: function(){
                self.onScrollRefresh();
            },
            onScrollMove: function(){
                self.onScrollMove();
            },
            onScrollEnd: function(){
                self.onScrollEnd();
            }
        })
    },
    ondetach: function(){
        if (this.mScroll) {
            this.mScroll.destroy();
        }
        this.mScroll = null;
    },
    onScrollRefresh: function(){
        console.log('-----------------REFRESH---------------')
    },
    onScrollMove: function(){
        console.log('-----------------MOVE---------------')
    },
    onScrollEnd: function(){
        console.log('-----------------END---------------')
    }
}));