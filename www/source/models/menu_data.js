/**
 * Created by user on 3/1/15.
 */
RAD.languages = {
    rus: 'Рус',
    ukr: 'Укр'
};
RAD.newsUrls = {
    rus: 'ru',
    ukr: 'ua',
    1: 'showbiz',
    2: 'sport',
    3: 'all_news2.0',
    4: 'ukraine',
    5: 'culture',
    6: 'cinema',
    7: 'music',
    8: 'boks',
    9: 'football',
    10: 'basketball',
    11: 'events',
    12: 'politics'
};
RAD.menuMapping = {
    rus: [
        {
            id: 1,
            title: 'Щоу-бизнес',
            subMenus: [
                {
                    id: 1,
                    title: 'Щоу-бизнес'
                },
                {
                    id: 5,
                    title: 'новости культуры'
                },
                {
                    id: 6,
                    title: 'новости кино'
                },
                {
                    id: 7,
                    title: 'музыка'
                }
            ]
        },
        {
            id: 2,
            title: 'Спорт',
            subMenus: [
                {
                    id: 2,
                    title: 'Спорт'
                },
                {
                    id: 8,
                    title: 'Бокс'
                },
                {
                    id: 9,
                    title: 'Футбол'
                },
                {
                    id: 10,
                    title: 'Баскетбол'
                }
            ]
        },
        {
            id: 3,
            title: 'Все новости',
            subMenus: [
                {
                    id: 3,
                    title: 'Все новости'
                }
            ]
        },
        {
            id: 4,
            title: 'Новости Украины',
            subMenus: [
                {
                    id: 4,
                    title: 'Новости Украины'
                },
                {
                    id: 11,
                    title: 'События в Украине'
                },
                {
                    id: 12,
                    title: 'Новости политики'
                }
            ]
        },
        {
            id: 1000,
            title: 'Избранное',
            subMenus: [
                {
                    id: 1000,
                    title: 'Избранное'
                }
            ]
        }
    ],
    ukr: [
        {
            id: 1,
            title: 'Щоу-бизнес',
            subMenus: [
                {
                    id: 1,
                    title: 'Щоу-бизнес'
                },
                {
                    id: 5,
                    title: 'новости культуры'
                },
                {
                    id: 6,
                    title: 'новости кино'
                },
                {
                    id: 7,
                    title: 'музыка'
                }
            ]
        },
        {
            id: 2,
            title: 'Спорт',
            subMenus: [
                {
                    id: 2,
                    title: 'Sport'
                },
                {
                    id: 8,
                    title: 'Box'
                },
                {
                    id: 9,
                    title: 'Football'
                },
                {
                    id: 10,
                    title: 'Basket'
                }
            ]
        },
        {
            id: 3,
            title: 'Все новости',
            subMenus: [
                {
                    id: 3,
                    title: 'Все новости'
                }
            ]
        },
        {
            id: 4,
            title: 'Новости Украины',
            subMenus: [
                {
                    id: 4,
                    title: 'Новости Украины'
                },
                {
                    id: 11,
                    title: 'События в Украине'
                },
                {
                    id: 12,
                    title: 'Новости политики'
                }
            ]
        },
        {
            id: 1000,
            title: 'Избранное',
            subMenus: [
                {
                    id: 1000,
                    title: 'Избранное'
                }
            ]
        }
    ]
};
RAD.model('Settings', Backbone.Model.extend({
    initialize: function(){
        var lang = window.localStorage.getItem('lang') || 'rus',
            selectedCategory = +window.localStorage.getItem('selectedCategory'),
            selectedSubCategory = +window.localStorage.getItem('selectedSubCategory'),
            font = +window.localStorage.getItem('font');
        this.on('change:lang', this.updateLang, this);
        this.on('change:font', this.updateFont, this);
        this.on('change:selectedCategory', this.updateSelectedCategory, this);
        this.on('change:selectedSubCategory', this.updateSelectedSubCategory, this);

        this.set({
            lang: lang,
            font: font || 14,
            selectedCategory: selectedCategory || 1,
            selectedSubCategory: selectedSubCategory || 1
        });
    },
    updateLang: function(model, val, opt){
        window.localStorage.setItem('lang', val);
    },
    updateFont: function(model, val, opt){
        var minFont = 8,
            maxFont = 50;
        if(val<minFont){
            this.set('font', minFont, {silent: true})
        }
        if(val>maxFont){
            this.set('font', maxFont, {silent: true})
        }
        window.localStorage.setItem('font', val);
    },
    updateSelectedCategory: function(model, val, opt){
        window.localStorage.setItem('selectedCategory', val);
    },
    updateSelectedSubCategory: function(model, val, opt){
        window.localStorage.setItem('selectedSubCategory', val);
    }
}), true);
RAD.model('MenuData', Backbone.Model.extend({
    initialize: function(data){
        var subMenus = data.subMenus;
        if(+data.id === +RAD.models.Settings.get('selectedCategory')){
            this.set('selected', true);
        }
       for(var i=0; i < subMenus.length; i++){
           if(+subMenus[i].id === +RAD.models.Settings.get('selectedSubCategory')){
               subMenus[i].selected = true;
           }
       }
    }
}), false);
RAD.model('Sidebar', Backbone.Collection.extend({
    model: RAD.models.MenuData,
    arr: [1,2,3,4,1000],
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
