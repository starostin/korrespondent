/**
 * Created by user on 3/1/15.
 */
RAD.languages = {
    rus: 'Рус',
    ukr: 'Укр'
};
RAD.menuMapping = {
    rus: [
        {
            id: 1,
            title: 'Щоу-бизнес',
            subMenus: ['новости культуры', 'новости кино', 'музыка']
        },
        {
            id: 2,
            title: 'Спорт',
            subMenus: ['футбол', 'бокс', 'баскетбол']
        },
        {
            id: 3,
            title: 'Все новости',
            subMenus: ['новости культуры', 'новости кино', 'музыка']
        },
        {
            id: 4,
            title: 'Новости Украины',
            subMenus: ['футбол', 'бокс', 'баскетбол']
        }
    ],
    ukr: [
        {
            id: 1,
            title:  'Щоу-бизнес-ukr',
            subMenus: ['новости культуры', 'новости кино', 'музыка']
        },
        {
            id: 2,
            title: 'Спорт-ukr',
            subMenus: ['футбол', 'бокс', 'баскетбол']
        },
        {
            id: 3,
            title: 'Все новости-ukr',
            subMenus: ['новости культуры', 'новости кино', 'музыка']
        },
        {
            id: 4,
            title: 'Новости Украины-ukr',
            subMenus: ['футбол', 'бокс', 'баскетбол']
        }
    ]
};
RAD.model('Settings', Backbone.Model.extend({
    initialize: function(){
        var lang = window.localStorage.getItem('lang') || 'rus',
            selectedCategory = window.localStorage.getItem('selectedCategory') || 2;
        this.set({
            lang: lang,
            selectedCategory: +selectedCategory
        })
    }
}), true);
RAD.model('MenuData', Backbone.Model.extend({
    initialize: function(data){
        if(data.id === RAD.models.Settings.get('selectedCategory')){
            this.set('selected', true);
        }
    }
}), false);
RAD.model('Sidebar', Backbone.Collection.extend({
    model: RAD.models.MenuData,
    arr: [1,2,3,4],
    resetWithOrder: function(){
        this.reset();
        var sortArr = JSON.parse(window.localStorage.getItem('sidebarOptionsOrder')) || this.arr,
            needMenu = RAD.menuMapping[RAD.models.Settings.get('lang')];
        for(var i=0; i<sortArr.length; i++){
            var option = _.findWhere(needMenu, {id: sortArr[i]});
            this.add(option);
        }
    },
    initialize: function(){
        this.resetWithOrder();
    }
}), true);
