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
        if(val === 1000){
            RAD.utils.sql.getRows('SELECT * FROM news WHERE lang = "' + lang + '" AND favorite = "true"').then(function(favorites){
                RAD.models.News.reset(favorites);
                options.callback = function(){
                    document.querySelector('.news-list-view').classList.add('favorites-list');
                };
                core.publish('navigation.show', options);
            });
            return;
        }
        RAD.utils.sql.getRows('SELECT * FROM news WHERE lang = "' + lang + '" AND newsId = "' + val + '"').then(function(oldNews){
            if(oldNews && oldNews.length){
                var buffer = [],
                    news = [];
                for(var i=0; i<oldNews.length; i++){
                    if(oldNews[i].buffer){
                        buffer.push(oldNews[i])
                    }else{
                        news.push(oldNews[i])
                    }
                }
                RAD.models.News.reset(news);
                core.startService();
                options.callback = function(){
                    RAD.models.BufferNews.reset(buffer);
                };
                core.publish('navigation.show', options);
            }else{
                RAD.models.News.getNews({
                    error: function(){
                        core.startService();
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
                    RAD.utils.sql.insertRows(data, 'news').then(function(){
                        RAD.models.News.reset(data);
                        core.startService();
                        core.publish('navigation.show', options);
                    });
                });
            }
        })
    };

    return app;
}, true);