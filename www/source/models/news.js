RAD.model('OneNews', Backbone.Model.extend({
    initialize: function(){

    }
}), false);
RAD.model('News', Backbone.Collection.extend({
    model: RAD.models.OneNews,
    url: function(){
        return 'http://k.img.com.ua/rss/ru/all_news2.0.xml';
    },
    test: function(){
        this.fetch({
            dataType: 'xml'
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