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
    stopEventsClasses: ['mover-wrapper'],
    speedArray: [],
    onrender: function(){
        this.nativeScroll = this.el.querySelector('.native-scroll');
        var self = this,
            scrollCoordinates = [];
        this.el.querySelector('.swipe-view').addEventListener('scroll', function(e){
            scrollCoordinates.push(e.target.scrollTop);
            if(self.getVertDirection(scrollCoordinates) === 'up'){
                if(self.scrollUp){
                    self.scrollUp(e.target.scrollTop)
                }
            }else{
                if(self.scrollDown){
                    self.scrollDown(e.target.scrollTop)
                }
            }
        });
    },
    touchStart: function(e){
        if(e.target.className.indexOf(this.stopEventsClasses[0]) !== -1) return;
        this.coordinates.x = [e.originalEvent.changedTouches[0].clientX];
        this.coordinates.y = [e.originalEvent.changedTouches[0].clientY];
        this.firstX = 0;
        this.firstY = 0;
        this.directionDefined = false;
        this.startCoord = this.el.getBoundingClientRect();
        this.startScrollCoord = this.nativeScroll.getBoundingClientRect();
        if(this.onSwipeTouchStart){
            this.onSwipeTouchStart(e)
        }
    },
    touchMove: function(e){
        this.coordinates.x.push(e.originalEvent.changedTouches[0].clientX);
        this.coordinates.y.push(e.originalEvent.changedTouches[0].clientY);
        if(this.coordinates.x.length<2 && !this.directionDefined){
            if(Math.abs(this.coordinates.x[this.coordinates.x.length-1] - e.originalEvent.changedTouches[0].clientX) >=50){
                this.directionVert = false;
                this.directionDefined = true;
            }else if(Math.abs(this.coordinates.y[this.coordinates.y.length-1] - e.originalEvent.changedTouches[0].clientY) >=50){
                this.directionVert = true;
                this.directionDefined = true;
            }
        }else if(!this.directionDefined){
            this.directionVert = this.isVertDirection(this.coordinates.x, this.coordinates.y);
            this.directionDefined = true;
        }else if(this.directionDefined && !this.directionVert){
            if(!this.firstX){
                this.firstX = e.originalEvent.changedTouches[0].clientX;
            }
            this.onMoveHorizontally(e)
        }else if(this.directionDefined && this.directionVert){
            if(!this.firstY){
                this.firstY = e.originalEvent.changedTouches[0].clientY;
            }
            this.onMoveVertically(e)
        }
    },
    touchEnd: function(e){
        if(e.target.className.indexOf(this.stopEventsClasses[0]) !== -1) return;
        if(this.onSwipeTouchEnd){
            this.onSwipeTouchEnd()
        }
        //if(!this.directionDefined || this.directionVert){
        //    return;
        //}
        this.startCoord = {};
        this.startScrollCoord = {};
        var tr = this.el.style.transform || 'translate3d(0,0,0)',
            value = tr.split('(')[1];
            value = parseInt(value.split(')')[0]);

        this.speedArray = [];
        this.el.removeAttribute('style');
        this.enableScroll();
        if( this.finishSwipe){
            this.finishSwipe(value, this.halfWidth, this.direction);
        }
    },
    getSpeed: function(obj){
        var distance = obj[obj.length - 1].coord - obj[obj.length - 2].coord,
            time = obj[obj.length - 1].time - obj[obj.length - 2].time;
        if(time > 70) {
            this.swipeSpeed = 0;
            return;
        }
        time = time/1000;
        this.swipeSpeed = distance/time;
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

        var firstX =  this.firstX,
            newX = e.originalEvent.changedTouches[0].clientX,
            diff = (this.startCoord.left || 0) + (newX - firstX);

        if(this.getHorDirection(this.coordinates.x) === 'left'){
            this.moveLeft(diff);
        }else{
            this.moveRight(diff);
        }

    },
    onMoveVertically: function(e){

    },
    moveLeft: function(diff){
        var viewCoord  = this.el.getBoundingClientRect();
        if(this.onMoveLeft){
            this.onMoveLeft(diff)
        }
        this.direction = 'left';
    },
    moveRight: function(diff){
        if(this.rightLineWidth && diff > this.rightLineWidth){
            diff = this.rightLineWidth;
        }
        if(this.onMoveRight){
            this.onMoveRight(diff)
        }
        this.direction = 'right';
    },
    getVertDirection: function(yArr){
        return yArr[yArr.length-2] < yArr[yArr.length-1] ? 'down' : 'up';
    },
    getHorDirection: function(xArr){
        return xArr[xArr.length-2] < xArr[xArr.length-1] ? 'right' : 'left';
    },
    isVertDirection: function(xArr, yArr){
        var xSum = 0, ySum = 0;
        for(var i=0; i<xArr.length; i++){
            xSum+=xArr[i];
        }
        for(var j=0; j<xArr.length; j++){
            ySum+=yArr[j];
        }
        if(xArr[0] && xArr[1] && Math.abs(xArr[0] - xArr[1]) >= 10){
            return false
        }
        if(yArr[0] && yArr[1] && Math.abs(yArr[0] - yArr[1]) >= 10){
            return true
        }
        return Math.abs(xArr[0] - xSum/xArr.length) <= Math.abs(yArr[0] - ySum/yArr.length)

    }
});