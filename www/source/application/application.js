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
    app.sendCrashWithData  =function(){
        if(!window.crashlyticsPlugin){
            console.log('For using Crashlytics run mobile application');
            return;
        }
            crashlyticsPlugin.setUserIdentifier('TheIdentifier');
            crashlyticsPlugin.setUserName('Francesco Verheye');
            crashlyticsPlugin.setUserEmail('verheye.francesco@gmail.com');

            crashlyticsPlugin.setStringValueForKey('MyString', 'stringkey');
            crashlyticsPlugin.setIntValueForKey(200, 'intkey');
            crashlyticsPlugin.setBoolValueForKey(true, 'boolkey');
            crashlyticsPlugin.setFloatValueForKey(1.5, 'floatkey');

            crashlyticsPlugin.addLog('This my a log message from JS!');
            crashlyticsPlugin.addLog('This is another log message from JS!');
            //crashlyticsPlugin.sendCrash();
    }

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
                    }
                }, function(data){
                    RAD.utils.sql.insertRows(data, 'news').then(function(){
                        RAD.models.News.reset(data);
                        allNewsCol.add(data);
                        core.publish('navigation.show', options);
                    });
                    RAD.models.News.downloadImages(data)
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
                core.publish('application.offline');
            },
            deviceBack = function(){
                if(RAD.models.Settings.get('sidebarOpen')){
                    RAD.models.Settings.set('sidebarOpen', false);
                    return;
                }
                if(!RAD.models.Settings.get('currentNews')){
                    navigator.app.exitApp();
                }else{
                    RAD.models.Settings.unset('currentNews');
                }
            },
            deviceready = function () {
                document.addEventListener("pause", pause, false);
                document.addEventListener("resume", resume, false);
                document.addEventListener("online", online, false);
                document.addEventListener("offline", offline, false);
                document.addEventListener("backbutton", deviceBack, true);
                console.log('deviceready');

                app.sendCrashWithData();
                RAD.utils.analytics('startTrackerWithId', ['UA-69555316-1']);

                app.setEnv('deviceready', true);
                RAD.utils.getFile('.nomedia', function (file) {
                        settings.rootPath = file.nativeURL.split('.nomedia')[0];
                        app.showScreen();
                    },
                    function () {
                        console.log('nomedia file has not created');
                        app.showScreen();
                    }, app);
            };
        document.addEventListener("deviceready", deviceready, false);

        if (!window.cordova) {
            app.showScreen();
        }
    };

    return app;
}, true);