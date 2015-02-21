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
            onScrollMove: function(e){
                //console.log(e)
                self.onScrollMove(e);
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
    onInitialize: function(){
        this.rotateCoef = 180/50;
    },
    onScrollRefresh: function(){
        console.log('-----------------REFRESH---------------')
    },
    onScrollMove: function(e){
        console.log('---------------MOVE-----------')
        if(this.mScroll.y<-50){
            return;
        }
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            deg = Math.abs(this.rotateCoef * this.mScroll.y)-180;
        if(this.mScroll.y>0){
            deg = -180;
        }

        arrow.style.transform = 'rotate(' + deg + 'deg)';
        if(deg <= -180 && !pullDiv.classList.contains('update')){
            console.log('-=-=-=-=-=-=UPDATE-=-=-=-=', this.mScroll.maxScrollY)
            this.mScroll.minScrollY = 0;
            pullDiv.classList.add('update');
        }else if(!pullDiv.classList.contains('update')){
            console.log('-=-=-=-=-=-=NOT-=-=-=-=')
            this.mScroll.minScrollY = -50;
            pullDiv.classList.remove('update');
        }else{
            console.log('-=-=-=-=-=-=ASSSSSSS-=-=-=-=')
        }
    },
    getNews: function(){
        var self = this,
            pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            spinner = pullDiv.querySelector('.loader');
        arrow.style.display = 'none';
        spinner.style.display = '';
        window.setTimeout(function(){
            spinner.style.display = 'none';
            pullDiv.classList.remove('update');
            self.mScroll.refresh();
            arrow.style.display = '';
        }, 1000)
    },
    onScrollEnd: function(){
        var pullDiv = this.el.querySelector('.pull-down'),
            arrow = pullDiv.querySelector('.arrow-img'),
            isUpdate = pullDiv.classList.contains('update'),
            spinner = pullDiv.querySelector('.loader');
        if(isUpdate && spinner.style.display === 'none'){
            console.log('--------------GET NEWS---------------')
            this.getNews();
        }

        console.log('-----------------END---------------')
    }
}));