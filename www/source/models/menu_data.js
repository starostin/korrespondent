/**
 * Created by user on 3/1/15.
 */
RAD.menuMapping = {
    rus: [
        {
            id: 1,
            title: 'Щоу-бизнес',
            subMenus: ['новости культуры', 'новости кино', 'музыка'],
            listNumber: 2
        },
        {
            id: 2,
            title: 'Спорт',
            subMenus: ['футбол', 'бокс', 'баскетбол'],
            listNumber: 1
        }
    ],
    ukr: [
        {
            id: 3,
            title: 'Щоу-бознес',
            subMenus: ['новости культуры', 'новости кино', 'музыка'],
            listNumber: 1
        },
        {
            title: 'Спорт',
            subMenus: ['футбол', 'бокс', 'баскетбол'],
            listNumber: 2
        }
    ]
};
RAD.model('Settings', Backbone.Model.extend({
    initialize: function(){
        var lang = window.localStorage.getItem('language') || 'rus',
            activeCategory = window.localStorage.getItem('activeCategory') || 2;
        this.set({
            lang: lang,
            activeCategory: activeCategory
        })
    }
}), true);
RAD.model('MenuData', Backbone.Model.extend({
    initialize: function(data){
        if(data.id === RAD.models.Settings.get('activeCategory')){
            this.set('active', true)
        }
    }
}), false);
RAD.model('Sidebar', Backbone.Collection.extend({
    model: RAD.models.MenuData,
    comparator: 'listNumber',
    initialize: function(){
        this.reset(RAD.menuMapping[RAD.models.Settings.get('lang')]);
    }
}), true);
