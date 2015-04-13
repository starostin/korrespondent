RAD.views.SwipeExt =  RAD.Blanks.View.extend({
    events: {
        'touchstart .swipe-view': 'touchStart',
        'touchmove .swipe-view': 'touchMove',
        'touchend .swipe-view': 'touchEnd',
        'touchcancel .swipe-view': 'touchCancel'
    },
    onattach: function(){
        var viewCoord  = this.el.getBoundingClientRect();
        this.halfWidth = viewCoord.width * 0.5;
    },
    coordinates: {
        x: [],
        y: []
    },
    onrender: function(){
        this.nativeScroll = this.el.querySelector('.native-scroll');
    },
    touchStart: function(e){
        this.coordinates.x = [e.originalEvent.changedTouches[0].clientX];
        this.coordinates.y = [e.originalEvent.changedTouches[0].clientY];
        this.directionDefined = false;
        this.startCoord = this.el.getBoundingClientRect();
        this.startScrollCoord = this.nativeScroll.getBoundingClientRect();
        if(this.onTouchStart){
            this.onTouchStart()
        }
    },
    touchMove: function(e){
        if(this.coordinates.x.length<5 && !this.directionDefined){
            if(Math.abs(this.coordinates.x[this.coordinates.x.length-1] - e.originalEvent.changedTouches[0].clientX) >=10){
                this.directionVert = false;
                this.directionDefined = true;
            }else if(Math.abs(this.coordinates.y[this.coordinates.y.length-1] - e.originalEvent.changedTouches[0].clientY) >=10){
                this.directionVert = true;
                this.directionDefined = true;
            }
            this.coordinates.x.push(e.originalEvent.changedTouches[0].clientX);
            this.coordinates.y.push(e.originalEvent.changedTouches[0].clientY);
        }else if(!this.directionDefined){
            this.directionVert = this.isVertDirection(this.coordinates.x, this.coordinates.y);
            this.directionDefined = true;
        }else if(this.directionDefined && !this.directionVert){
            this.onMoveHorizontally(e)
        }else if(this.directionDefined && this.directionVert){
            this.onMoveVertically(e)
        }
    },
    touchEnd: function(){
        if(this.onTouchEnd){
            this.onTouchEnd()
        }
        if(!this.directionDefined || this.directionVert){
            return;
        }
        this.startCoord = {};
        this.startScrollCoord = {};
        var tr = this.el.style.transform,
            value = tr.split('(')[1];
        value = parseInt(value.split(')')[0]);
        this.el.style.transition  = 'all 0.3s ease-in-out';
        this.el.style.webkitTransition  = 'all 0.3s ease-in-out';
        this.el.removeAttribute('style');
        this.enableScroll();
        this.finishSwipe(value, this.halfWidth);
    },
    disableScroll: function(){
        if(this.mScroll){
            this.mScroll.disable();
        }else if(this.nativeScroll){
            this.nativeScroll.classList.add('stop-scrolling');
        }
    },
    enableScroll: function(){
        if(this.mScroll){
            this.mScroll.enable();
        }else if(this.nativeScroll){
            this.nativeScroll.classList.remove('stop-scrolling');
        }
    },
    onMoveHorizontally: function(e){
        this.disableScroll();
        this.el.style.transition  = 'none';
        this.el.style.webkitTransition  = 'none';
        var firstX = this.coordinates.x[this.coordinates.x.length-1],
            newX = e.originalEvent.changedTouches[0].clientX,
            diff = this.startCoord.left + (newX - firstX);

        if(diff<0){
            this.moveLeft(diff);
        }else{
            this.moveRight(diff);
        }

    },
    onMoveVertically: function(e){

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
        this.el.style.webkitTransform = 'translateX(' + (diff)+ 'px)';
    },
    moveRight: function(diff){
        if(this.rightLineWidth && diff > this.rightLineWidth){
            diff = this.rightLineWidth;
        }
        this.el.style.transform = 'translateX(' + (diff)+ 'px)';
        this.el.style.webkitTransform = 'translateX(' + (diff)+ 'px)';
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

    }
});