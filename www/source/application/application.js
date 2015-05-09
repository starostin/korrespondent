RAD.application(function (core) {
    var app = this;
    app.cordovaEnv = {};
    app.isEnv = function (key) {
        return !!this.cordovaEnv[key];
    };

    app.setEnv = function (key, value) {
        this.cordovaEnv[key] = value;
        return app;
    };
    app.showScreen = function(){
        var options = {
                container_id: '#screen',
                content: "view.main_screen",
                animation: 'none'
            },
            settings = RAD.models.Settings,
            val = settings.get('selectedSubCategory'),
            lang = settings.get('lang');

        RAD.utils.sql.getRows('SELECT * FROM news').then(function(allNews){
            RAD.models.AllNews.reset(allNews);
            var favorites = RAD.models.AllNews.where({lang: lang, favorite: 'true'});
            RAD.models.FavotiteNews.reset(favorites);
            if(val === 1000){
                    RAD.models.News.reset(favorites);
                    options.callback = function(){
                        document.querySelector('.news-list-view').classList.add('favorites-list');
                    };
                    core.publish('navigation.show', options);
                return;
            }
            var currentNews = RAD.models.AllNews.where({lang: lang, newsId: val});
            if(currentNews.length){
                var buffer = [],
                    news = [];
                for(var i=0; i<currentNews.length; i++){
                    if(currentNews[i].buffer){
                        buffer.push(currentNews[i])
                    }else{
                        news.push(currentNews[i])
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
                        RAD.models.AllNews.add(data);
                        core.startService();
                        core.publish('navigation.show', options);
                    });
                    RAD.models.News.downloadImages(data).then(function(schemas){
                        RAD.utils.sql.insertRows(schemas, 'news')
                    })
                });
            }
        })
    };
    app.start = function () {
        var pause = function () {
                console.log('pause');
                app.setEnv('pause', true);
            },
            resume = function () {
                console.log('resume');
                app.setEnv('pause', false);
                core.publish('application.resume');
            },
            online = function () {
                console.log('online');
                app.setEnv('online', true);
                core.publish('application.online');
            },
            offline = function () {
                console.log('offline');
                app.setEnv('online', false);
                core.publish('application.offline');
            },
            deviceready = function () {
                document.addEventListener("pause", pause, false);
                document.addEventListener("resume", resume, false);
                document.addEventListener("online", online, false);
                document.addEventListener("offline", offline, false);
                console.log('deviceready');

                app.setEnv('deviceready', true);
                app.showScreen();
            };

        document.addEventListener("deviceready", deviceready, false);
        if (!window.cordova) {
            app.showScreen();
        }
    };

    return app;
}, true);