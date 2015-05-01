/**
 * Created by user on 3/7/15.
 */
RAD.namespace('RAD.utils.getImageLink', function(str){
    if(!str) return;
    var regex = /<img.*?src="(.*?\/([^\/"]*))".*?>/;

    return regex.exec(str) && regex.exec(str)[1];
});
RAD.namespace('RAD.utils.getBigImage', function(link){
    var parts = link && link.split('/'),
        bigImage = '';
    if(parts){
        parts[4] = '610x385';
        bigImage = parts.join('/')
    }

    return bigImage;
});