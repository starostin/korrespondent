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
            });
        return _.filter(data, function(item){
            return +new Date(item.pubDate) > +new Date(maxDate.pubDate);
        });
    },
    setNews: function(opt){
        var self = this,
            settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang'),
            identifier = lang + val,
            oldNews = JSON.parse(window.localStorage.getItem(identifier)) || [];


        var options = {
            url: 'http://k.img.com.ua/rss/' + RAD.newsUrls[lang] + '/' + RAD.newsUrls[val] + '.xml',
            type: 'GET',
            dataType: 'xml',
            success: function(data){
                data = self.parseXml(data);
                if(!oldNews.length){
                    RAD.models.News.reset(oldNews.concat(data));
                    window.localStorage.setItem(identifier, JSON.stringify(oldNews.concat(data)));
                }else if(opt.addBuffer){
                    RAD.models.News.add(data);
                    RAD.models.News.add([{
                        author: "1480",
                        category: "Новини Формули-1",
                        comments: "http://ua.korrespondent.net/sport/formula/3490829-pilot-Williams-pislia-kvalifikatsii-hran-pri-avstralii-potrapyv-u-likarnui#comment_header_layer",
                        description: "лікарню",
                        guid: +new Date(),
                        image: "http://kor.ill.in.ua/m/190x120/1594745.jpg",
                        link: "http://ua.korrespondent.net/sport/formula/3490829-pilot-Williams-pislia-kvalifikatsii-hran-pri-avstralii-potrapyv-u-likarnui",
                        pubDate: "Sat, 14 Mar 2015 14:01:00 +0200",
                        source: "f1news.ruf1news.ru",
                        title: "Пілот Williams після кваліфікації Гран-прі Австралії потрапив у лікарню"
                    },
                        {
                            author: "1480",
                            category: "Новини Формули-1",
                            comments: "http://ua.korrespondent.net/sport/formula/3490829-pilot-Williams-pislia-kvalifikatsii-hran-pri-avstralii-potrapyv-u-likarnui#comment_header_layer",
                            description: "лікарню",
                            guid: +new Date(),
                            image: "http://kor.ill.in.ua/m/190x120/1594745.jpg",
                            link: "http://ua.korrespondent.net/sport/formula/3490829-pilot-Williams-pislia-kvalifikatsii-hran-pri-avstralii-potrapyv-u-likarnui",
                            pubDate: "Sat, 14 Mar 2015 14:01:00 +0200",
                            source: "f1news.ruf1news.ru",
                            title: "Пілот Williams після кваліфікації Гран-прі Австралії потрапив у лікарню"
                        }]);
                    window.localStorage.setItem(identifier, JSON.stringify(oldNews.concat(data)));
                }else{
                    //self.reset(oldNews);
                    var newNews = RAD.models.News.getLastNews(data);
                    RAD.models.BufferNews.add(newNews, {silent: true});
                    RAD.models.BufferNews.trigger('add');
                }
            }
        };
        $.extend(options, opt);
        $.ajax(options);
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