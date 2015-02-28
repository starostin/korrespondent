RAD.view("view.news_list", RAD.Blanks.View.extend({
    url: 'source/views/main_screen/news_list/news_list.html',
    className: 'main-list',
    events: {
        'click .sidebar-button': 'toggleSidebar',
        'touchstart .news-list': 'onTouchStart',
        'touchmove .news-list': 'onTouchMove',
        'touchend .news-list': 'onTouchEnd',
        'touchcancel .news-list': 'onTouchCancel'
    },
    onattach: function(){
        var self = this,
            wrapper = this.el.querySelector('.scroll-view');
        this.mScroll = new iScroll(wrapper, {
            useTransition: true,
            hScrollbar: false,
            vScrollbar: false,
            topOffset: 50,
            y: -50,
            onScrollStart: function(){
                self.onScrollStart();
            },
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
        });
    },
    onStartAttach: function(){
        var viewCoord  = this.el.getBoundingClientRect();
        this.rightLineWidth = viewCoord.width * 0.9;
        this.halfWidth = viewCoord.width * 0.5;
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
    toggleSidebar: function(){
        this.el.classList.toggle('open');
    },
    onScrollStart: function(){

    },
    onScrollRefresh: function(){

    },
    onScrollMove: function(e){
        console.log( this.mScroll.preventScroll)
        if(this.directionDefined && !this.directionVert){
            this.mScroll.preventScroll = true;
        }
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
            this.mScroll.minScrollY = 0;
            pullDiv.classList.add('update');
        }else if(!pullDiv.classList.contains('update')){
            this.mScroll.minScrollY = -50;
            pullDiv.classList.remove('update');
        }
    },
    coordinates: {
        x: [],
        y: []
    },
    onTouchStart: function(){
        this.coordinates.x = [];
        this.coordinates.y = [];
        this.directionDefined = false;
        this.mScroll.preventScroll = this.el.classList.contains('open');
        this.startCoord = this.el.getBoundingClientRect();
    },
    onTouchMove: function(e){
        if(this.coordinates.x.length<5){
            this.coordinates.x.push(e.originalEvent.changedTouches[0].clientX);
            this.coordinates.y.push(e.originalEvent.changedTouches[0].clientY);
        }else if(!this.directionDefined){
            this.directionVert = this.isVertDirection(this.coordinates.x, this.coordinates.y);
            this.directionDefined = true;
        }else if(this.directionDefined && !this.directionVert){
            this.onMoveHorizontally(e)
        }
    },
    onTouchEnd: function(){
        if(!this.directionDefined || this.directionVert){
            return;
        }
        this.startCoord = {};
        var tr = this.el.style.transform,
            value = tr.split('(')[1];
            value = parseInt(value.split(')')[0]);
        this.el.style.transition  = 'all 0.3s ease-in-out';
        this.el.removeAttribute('style');
        if(value >= this.halfWidth){
            this.el.classList.add('open');
        }else{
            this.el.classList.remove('open')
        }
    },
    onMoveHorizontally: function(e){
        this.el.style.transition  = 'none';
        var firstX = this.coordinates.x[this.coordinates.x.length-1],
            newX = e.originalEvent.changedTouches[0].clientX,
            diff = this.startCoord.left + (newX - firstX);

        if(diff<0){
           this.moveLeft(diff);
        }else{
            this.moveRight(diff);
        }

    },
    moveLeft: function(diff){
        var viewCoord  = this.el.getBoundingClientRect();
        if(viewCoord.left<0){
            return;
        }
        if(diff < 0){
            diff = 0
        }
        this.el.style.transform = 'translateX(' + (diff)+ 'px)';
    },
    moveRight: function(diff){
        if(diff > this.rightLineWidth ){
            diff = this.rightLineWidth;
        }
        this.el.style.transform = 'translateX(' + (diff)+ 'px)';
    },
    isVertDirection: function(xArr, yArr){
        var xSum = 0, ySum = 0;
        for(var i=0; i<xArr.length; i++){
            xSum+=xArr[i];
        }
        for(var j=0; j<xArr.length; j++){
            ySum+=yArr[j];
        }
        return Math.abs(xArr[0] - xSum/xArr.length) <= Math.abs(yArr[0] - ySum/yArr.length)

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
            this.getNews();
        }
    }
}));