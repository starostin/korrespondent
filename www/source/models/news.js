RAD.model('OneNews', Backbone.Model.extend({
    idAttribute: 'ident',
    initialize: function(data){
        //this.unset('buffer');
    }
}), false);
RAD.model('AllNews', Backbone.Collection.extend({
    model: Backbone.Model.extend({
        idAttribute: 'ident'
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
        RAD.utils.sql.insertRows([model.toJSON()], 'news');
    },
    getLastNews: function(data){
        var maxDate = _.max(this.toJSON(), function(item){
                return +new Date(item.pubDate)
            });
        return _.filter(data, function(item){
            return +new Date(item.pubDate) > +new Date(maxDate.pubDate);
        });
    },
    getNews: function(opt, callback){
        var self = this,
            settings = RAD.models.Settings,
            newsId = settings.get('selectedSubCategory'),
            parentId = settings.get('selectedCategory'),
            lang = settings.get('lang');
        var options = {
            url: 'http://k.img.com.ua/rss/' + RAD.newsUrls[lang] + '/' + RAD.newsUrls[newsId] + '.xml',
            type: 'GET',
            timeout: 10000,
            dataType: 'xml',
            success: function(data){
                data = self.parseXml(data, newsId, parentId, lang);
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
            RAD.models.News.add(newNews);
            RAD.utils.sql.insertRows(newNews, 'news');
            RAD.models.News.downloadImages(newNews);
        }
        this.getNews(opt, callback);
    },
    getNewNews: function(data){
        var uniqueNews = [];
        for(var i=0; i<data.length; i++){
            if(!this.findWhere({guid: data[i].guid, newsId: data[i].newsId})){
                uniqueNews.push(data[i])
            }
        }
        return uniqueNews
    },
    parseXml: function(xml, id, parentId, lang){
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
                    favorite: 0,
                    buffer: 0,
                    imageDownloaded: 0,
                    bigImageDownloaded: 0,
                    newsId: id,
                    parentId: parentId,
                    lang: lang,
                    category: $this.find("category").text(),
                    comments: $this.find("comments").text(),
                    source: $this.find("source").text()
                };
            item.ident = item.guid + '_' + item.newsId + '_' + item.lang;
            var imageParts = item.image.split('/');
            item.imageName = imageParts[imageParts.length-1];
            item.bigImage = RAD.utils.getBigImage(item.image);
            newsArr.push(item);
        });
        return newsArr;
    },
    downloadImages: function(data){
        for(var i=0; i<data.length; i++)(function(i){
            RAD.utils.download(data[i].image, settings.image, this).done(function(){
                data[i].imageDownloaded = 1;
                RAD.utils.sql.insertRows(data[i], 'news');
            });
            RAD.utils.download(data[i].bigImage, settings.bigImage, this).done(function(){
                data[i].bigImageDownloaded = 1;
                RAD.utils.sql.insertRows(data[i], 'news');
            })
        })(i)
    }
}), true);