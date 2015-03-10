RAD.view("view.news_list", RAD.Blanks.ScrollableView.extend({
    url: 'source/views/main_screen/news_list/news_list.html',
    className: 'main-list',
    events: {
        'tap .news-topic': 'toggleSubMenu',
        'tap .sidebar-button': 'toggleSidebar',
        'tap .sub-menu-item': 'changeSubMenu',
        'touchstart .news-list': 'onTouchStart',
        'touchmove .news-list': 'onTouchMove',
        'touchend .news-list': 'onTouchEnd',
        'touchcancel .news-list': 'onTouchCancel'
    },
    onInitialize: function(){
        var self = this;
        this.rotateCoef = 180/50;
        this.sidebar = RAD.models.Sidebar;
        this.settings = RAD.models.Settings;
        this.news = RAD.models.News;
        this.bufferNews = RAD.models.BufferNews;
        this.bufferNews = RAD.models.BufferNews;
        this.settings.on('change:selectedSubCategory', this.setNews, this);
        this.settings.on('change:lang', this.setNews, this);
        this.news.on('reset', this.updateList, this);
        this.bufferNews.on('all', this.showUpdateMessage, this);
        this.bufferNews.on('all', this.showUpdateMessage, this);
        this.scrollOptions  = {
        this.setNews();
        this.scrollOptions = options = {
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
        }
    },
    onStartAttach: function(){
        var viewCoord  = this.el.getBoundingClientRect();
        this.rightLineWidth = viewCoord.width * 0.9;
        this.halfWidth = viewCoord.width * 0.5;
    },
    onStartRender: function(){
        this.selected = this.sidebar.findWhere({selected: true});
    },
    onReceiveMsg: function(channel, data){
        var parts = channel.split('.'),
            method = parts[2];
        if(typeof this[method] === 'function'){
            this[method](data)
        }else{
            console.log('view.news_list does not have method '+ method)
        }
    },
    updateList: function(){
        this.render();
    },
    showUpdateMessage: function(model, collection, options){
        var updateMessage = this.el.querySelector('.update-message');
        if(this.bufferNews.length){
            updateMessage.classList.add('show');
            updateMessage.setAttribute('data-count', this.bufferNews.length);
        }else {
            updateMessage.classList.remove('show');
        }
    },
    changeSubMenu: function(e){
        var curTar = e.currentTarget,
            newId = +curTar.getAttribute('data-id'),
            oldSelectedSub = _.findWhere(this.selected.get('subMenus'), {selected: true}),
            newSelectedSub = _.findWhere(this.selected.get('subMenus'), {id: newId});

        delete oldSelectedSub.selected;
        newSelectedSub.selected = true;
        this.settings.set('selectedSubCategory', newId);
    },
    setNews: function(model, val, option){
        var self = this,
            subMenu = this.el.querySelector('.sub-menu'),
            newsId = this.settings.get('selectedSubCategory'),
            lang = this.settings.get('lang');
        this.bufferNews.reset();
        if(subMenu.classList.contains('open')){
            subMenu.classList.remove('open');
        }

    },
    toggleSubMenu: function(e){
        var subMenu = this.el.querySelector('.sub-menu');
        subMenu.classList.toggle('open');
    },
    toggleSidebar: function(){
        this.el.classList.toggle('open');
    },
    onScrollStart: function(){

    },
    onScrollRefresh: function(){

    },
    onScrollMove: function(e){
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
        this.news.setNews({addBuffer: true});
        this.setNews();
    },
    showErrorMessage: function(){
        var errorDiv = this.el.querySelector('.message');
        errorDiv.classList.add('show');
        window.setTimeout(function(){
            errorDiv.classList.remove('show');
        }, 2000)
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