RAD.model('OneNews', Backbone.Model.extend({
    idAttribute: "guid",
    initialize: function(data){
        this.unset('buffer');
    }
}), false);
RAD.model('OneFavoriteNews', Backbone.Model.extend({
    initialize: function(data){

    }
}), false);
RAD.model('FavotiteNews', Backbone.Collection.extend({
    model: RAD.models.OneFavoriteNews,
    initialize: function(data){

    }
}), true);
RAD.model('OneBufferNews', Backbone.Model.extend({
    initialize: function(data){
        this.set('buffer', 1);
    }
}), false);
RAD.model('BufferNews', Backbone.Collection.extend({
    model: RAD.models.OneBufferNews
}), true);
RAD.model('AllNews', Backbone.Collection.extend({
    model: Backbone.Model.extend({
        idAttribute: "guid"
    })
}), true);
RAD.model('News', Backbone.Collection.extend({
    model: RAD.models.OneNews,
    comparator: function(item){
        return -(+new Date(item.get('pubDate')));
    },
    initialize: function(){
        this.on('change:favorite', this.setFavorite, this);
        this.on('add', this.addNewsToAll, this)
    },
    addNewsToAll: function(model, col, opt){
        RAD.models.AllNews.add(model.toJSON())
    },
    setFavorite: function(model, val, options){
        if(val){
            RAD.models.FavotiteNews.add(model.toJSON());
        }else{
            RAD.models.FavotiteNews.remove(RAD.models.FavotiteNews.findWhere({guid: model.get('guid')}));
        }
        RAD.utils.sql.insertRows([model.toJSON()], 'news');
    },
    getLastNews: function(data){
        var news = RAD.models.BufferNews.length ? RAD.models.BufferNews : this,
            maxDate = _.max(news.toJSON(), function(item){
                return +new Date(item.pubDate)
            });
        return _.filter(data, function(item){
            return +new Date(item.pubDate) > +new Date(maxDate.pubDate);
        });
    },
    getNews: function(opt, callback){
        var self = this,
            settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang');
        var options = {
            url: 'http://k.img.com.ua/rss/' + RAD.newsUrls[lang] + '/' + RAD.newsUrls[val] + '.xml',
            type: 'GET',
            timeout: 10000,
            dataType: 'xml',
            success: function(data){
                data = self.parseXml(data, val);
                callback(self.getNewNews(data))
            }
        };
        $.extend(options, opt);
        $.ajax(options);
    },
    setBufferNews: function(opt){
        function callback(data){
            var newNews = RAD.models.News.getLastNews(data);
            _.each(newNews, function(item){
                item.buffer = 1;
            });
            RAD.models.BufferNews.add(newNews, {silent: true});
            RAD.utils.sql.insertRows(RAD.models.BufferNews.toJSON(), 'news').then(function(){
                RAD.models.BufferNews.trigger('add');
            });
            RAD.models.News.downloadImages(newNews).then(function(schemas){
                RAD.utils.sql.insertRows(schemas, 'news')
            })
        }
        this.getNews(opt, callback);
    },
    getNewNews: function(data){
        var uniqueNews = [];
        for(var i=0; i<data.length; i++){
            if(!this.findWhere({guid: data[i].guid})){
                uniqueNews.push(data[i])
            }
        }
        console.log(uniqueNews)
        return uniqueNews
    },
    parseXml: function(xml, id){
        var newsArr = [];
        $(xml).find("item").each(function() {
            var $this = $(this),
                item = {
                    title: $this.find("title").text(),
                    link: $this.find("link").text(),
                    description: $this.find("description").text(),
                    fullText: $this.find("fulltext").text(),
                    author: $this.find("author").text(),
                    image:  RAD.utils.getImageLink($this.find("image").text()),
                    pubDate: $this.find("pubDate").text(),
                    guid: $this.find("guid").text(),
                    favorite: "",
                    newsId: id,
                    category: $this.find("category").text(),
                    comments: $this.find("comments").text(),
                    source: $this.find("source").text()
                };

            item.bigImage = RAD.utils.getBigImage(item.image);
            newsArr.push(item);
        });
        return newsArr;
    },
    downloadImages: function(data){
        var arr = _.clone(data),
            $deferred = $.Deferred();
        function downloadSmallImages(withoutImg){
            var whenImages = [],
                $deferredImages = $.Deferred();
            for(var i=0; i<withoutImg.length; i++){
                whenImages.push(RAD.utils.download(withoutImg[i].image, settings.image, this, withoutImg[i]));
            }
            $.when.apply($, whenImages).then(function() {
                $deferredImages.resolve([].slice.call(arguments));
            });
            return $deferredImages.promise();
        }
        $.when(downloadSmallImages(arr)).then(function(withSmallImg){
            var whenBigImages = [],
                $deferredBigImages = $.Deferred();
            for(var i=0; i<withSmallImg.length; i++){
                if(!withSmallImg[i]) continue;
                whenBigImages.push(RAD.utils.download(withSmallImg[i].bigImage, settings.bigImage, this, withSmallImg[i]));
            }
            $.when.apply($, whenBigImages).then(function() {
                $deferred.resolve([].slice.call(arguments))
            });
            return $deferredBigImages.promise();
        });
        return $deferred.promise()
    }
}), true);