RAD.model('OneNews', Backbone.Model.extend({
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
    initialize: function(){
        var settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang'),
            identifier = lang + val,
            items = JSON.parse(window.localStorage.getItem(identifier)) || [];

        this.reset(items);
    },
    getLastNews: function(data){
        var news = RAD.models.BufferNews.length ? RAD.models.BufferNews : this,
            maxDate = _.max(news.toJSON(), function(item){
                return +new Date(item.pubDate)
            }),
            newNews = _.filter(data.toJSON(), function(item){
                console.log('---------------------item date--------------', item.pubDate)
                console.log('---------------------max date--------------', maxDate.pubDate)
                return +new Date(item.pubDate) > +new Date(maxDate.pubDate);
            });
        return newNews;
    },
    setNews: function(opt){
        var settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang'),
            identifier = lang + val;
        var options = {
            url: 'http://k.img.com.ua/rss/' + RAD.newsUrls[lang] + '/' + RAD.newsUrls[val] + '.xml',
            dataType: 'xml',
            silent: true,
            reset: true,
            success: function(data){
                var oldNews = JSON.parse(window.localStorage.getItem(val)) || [];
                window.localStorage.setItem(identifier, JSON.stringify(oldNews.concat(data.toJSON())));
            }
        };
        $.extend(options, opt);
        this.fetch(options);
    },
    parse: function(xml){
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