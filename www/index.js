(function (document, window) {
    // don't remove ## marks, CLI uses them for updating this file
    // #script_begin#
    
    var scripts = [
        //------------------------------MODELS-----------------------
        "source/models/menu_data.js",
        "source/models/news.js",
        //------------------------------VIEWS-----------------------
        "source/views/main_screen/main_screen.js",
        "source/views/main_screen/news_list/news_list.js",
        "source/views/main_screen/sidebar_menu/sidebar_menu.js",
        "source/views/main_screen/one_news/one_news.js",
        "source/views/main_screen/favorites/favorites.js",
        //------------------------------SERVICES-----------------------
        "source/service/check_news.js",
        //------------------------------APP-----------------------
        "source/application/application.js"
    ];
    // #script_end#
    function onEndLoad() {

        var core = window.RAD.core,
            application = window.RAD.application,
            coreOptions = {
                defaultBackstack: false,
                defaultAnimation: 'none',
                animationTimeout: 3000,
                debug: false
            };

        //initialize core by new application object
        core.initialize(application, coreOptions);

        //start
        application.start();
    }

    window.RAD.scriptLoader.loadScripts(scripts, onEndLoad);
}(document, window));