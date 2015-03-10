RAD.application(function (core) {
    var app = this;

    app.start = function () {

// to add your first view - run "rad add view view.main" from the root of this project
// you can use the code below to show your first view
        var options = {
            container_id: '#screen',
            content: "view.main_screen",
            animation: 'none'
        };
        var settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang'),
            identifier = lang + val;
        core.startService();
        RAD.models.News.setNews({
            success: function(data){
                //core.publish('service.check_news.startTracking', null);
                var oldNews = JSON.parse(window.localStorage.getItem(val)) || [];
                window.localStorage.setItem(identifier, JSON.stringify(oldNews.concat(data.toJSON())));
                core.publish('navigation.show', options);
            }
        });
    };

    return app;
}, true);
