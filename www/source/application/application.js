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
            allNewsCol = RAD.models.AllNews,
            lang = settings.get('lang');

        RAD.utils.sql.getRows('SELECT * FROM news').then(function(allNews){
            allNewsCol.reset(allNews);
            var favorites = allNewsCol.where({lang: lang, favorite: 1});
            core.startService();
            if(val === 1000){
                    RAD.models.News.reset(favorites);
                    options.callback = function(){
                        document.querySelector('.news-list-view').classList.add('favorites-list');
                    };
                    core.publish('navigation.show', options);
                return;
            }
            var currentNews = allNewsCol.where({lang: lang, newsId: val});
            if(currentNews.length){
                RAD.models.News.reset(currentNews);
                core.publish('navigation.show', options);
            }else{
                RAD.models.News.getNews({
                    error: function(){
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
                        allNewsCol.add(data);
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