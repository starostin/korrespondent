RAD.model('OneNews', Backbone.Model.extend({
    idAttribute: "guid",
    initialize: function(data){

    }
}), false);
RAD.model('OneBufferNews', Backbone.Model.extend({
    initialize: function(data){

    }
}), false);
RAD.model('BufferNews', Backbone.Collection.extend({
    model: RAD.models.OneBufferNews
}), true);
RAD.model('News', Backbone.Collection.extend({
    model: RAD.models.OneNews,
    comparator: function(item){
        return -(+new Date(item.get('pubDate')));
    },
    initialize: function(){},
    getLastNews: function(data){
        var news = RAD.models.BufferNews.length ? RAD.models.BufferNews : this,
            maxDate = _.max(news.toJSON(), function(item){
                return +new Date(item.pubDate)
            });
        return _.filter(data, function(item){
            return +new Date(item.pubDate) > +new Date(maxDate.pubDate);
        });
    },
    setNews: function(opt){
        var self = this,
            settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang');

            RAD.utils.sql.getRows('SELECT * FROM news WHERE lang = "' + lang + '" AND newsId = "' + val + '"').then(function(oldNews){
                var options = {
                    url: 'http://k.img.com.ua/rss/' + RAD.newsUrls[lang] + '/' + RAD.newsUrls[val] + '.xml',
                    type: 'GET',
                    timeout: 10000,
                    dataType: 'xml',
                    success: function(data){
                        data = self.parseXml(data);
                        if(!oldNews.length){
                            RAD.utils.sql.insertRows(data).then(function(){
                                RAD.models.News.reset(oldNews.concat(data));
                            });
                        }else{
                            var newNews = RAD.models.News.getLastNews(data);
                            console.log('----------------BUFFER-----------------', newNews);
                            _.each(newNews, function(item){
                                item.buffer = true;
                            });
                            RAD.models.BufferNews.add(newNews, {silent: true});
                            RAD.utils.sql.insertRows(newNews).then(function(){
                                RAD.models.BufferNews.trigger('add');
                            });
                        }
                    }
                };
                $.extend(options, opt);
                $.ajax(options);
            });
    },
    parseXml: function(xml){
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
                    category: $this.find("category").text(),
                    comments: $this.find("comments").text(),
                    source: $this.find("source").text()
                };
            newsArr.push(item);
        });
        return newsArr;
    }
}), true);