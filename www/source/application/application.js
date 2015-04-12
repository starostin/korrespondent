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
            lang = settings.get('lang');
        RAD.utils.sql.getRows('SELECT * FROM news WHERE lang = "' + lang + '" AND newsId = "' + val + '"').then(function(news){
            if(news && news.length){
                RAD.models.News.reset(news);
                core.publish('service.check_news.startTracking');
                core.publish('navigation.show', options);
            }else{
                RAD.models.News.getNews({
                    error: function(){
                        core.publish('service.check_news.startTracking');
                        core.publish('navigation.show', options);
                        options.callback = function(){
                            var errorDiv = document.querySelector('.message');
                            errorDiv.classList.add('show');
                            window.setTimeout(function(){
                                errorDiv.classList.remove('show');
                            }, 2000)
                        }
                    }
                }, function(data){
                    RAD.models.News.reset(data);
                    core.publish('service.check_news.startTracking');
                    core.publish('navigation.show', options);
                });
            }
        })
    };

    return app;
}, true);