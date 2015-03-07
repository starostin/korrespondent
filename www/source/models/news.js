RAD.model('OneNews', Backbone.Model.extend({
    initialize: function(data){

    }
}), false);
RAD.model('News', Backbone.Collection.extend({
    model: RAD.models.OneNews,
    initialize: function(){
        var selected = RAD.models.Settings.get('selectedSubCategory'),
            items = JSON.parse(window.localStorage.getItem(selected)) || [];
        this.reset(items);
    },
    setNews: function(val, lang){
        this.fetch({
            url: 'http://k.img.com.ua/rss/' + RAD.newsUrls[lang] + '/' + RAD.newsUrls[val] + '.xml',
            dataType: 'xml',
            success: function(data){
                var oldNews = JSON.parse(window.localStorage.getItem(val)) || [];
                window.localStorage.setItem(val, JSON.stringify(oldNews.concat(data.toJSON())));
            },
            reset: true
        })
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
                    image:  $this.find("image").text(),
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