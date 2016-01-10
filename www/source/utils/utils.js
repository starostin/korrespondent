/**
 * Created by user on 3/7/15.
 */
RAD.namespace('RAD.utils.getImageLink', function(str){
    if(!str) return;
    var regex = /<img.*?src="(.*?\/([^\/"]*))".*?>/;

    return regex.exec(str) && regex.exec(str)[1];
});
RAD.namespace('RAD.utils.checkConnection', function () {

    if (!window.cordova) {
        console.log('Connection API use cordova');
        return true;
    }

    var networkState = navigator.connection.type,
        states = {};

    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = false;

    return states[networkState];
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
RAD.namespace('RAD.utils.download', function(link, folder, context, name){
    var $deferred = $.Deferred();
    if(!window.cordova) {
        console.log('Download plugin use cordova');
        $deferred.reject();
        return $deferred.promise();
    }
    var callbackFn = function(entry){
            var fileTransfer = new FileTransfer();
            var uri = encodeURI(link.split('?')[0]),
                filename = name || (function () {
                        var parts = link.split('/'),
                            lastIndex =  parts.length - 1;
                        return parts[lastIndex].replace(/\?.+/, '');
                    } ()),
                filePath = entry.toURL() + '/' + filename;

            fileTransfer.download(
                uri,
                filePath,
                function(entry) {
                    console.log("download complete: " + entry.fullPath);
                    $deferred.resolve()
                },
                function(error) {
                    console.log("download error source " + error.source);
                    console.log("download error target " + error.target);
                    console.log("upload error code" + error.code);
                    $deferred.reject()
                },
                false
            );
        },
        fail = function(e){

        };
    RAD.utils.getDirectory(folder, callbackFn, fail, context);
    return $deferred.promise();
});
RAD.namespace('RAD.utils.getDirectory', function (dir, callback, fail, context) {
    var dirArr = dir.split('/'),
        length = dirArr.length,
        counter = 0,
        callbackFn = function getDirectory(fileSystem) {
            var root = fileSystem.root || fileSystem,
                success,
                error = function (error) {
                    RAD.utils.callback(fail, context, arguments);
                };

            if (length - 1 === counter) {
                success = function (entry) {
                    RAD.utils.callback(callback, context, arguments);
                };
            } else {
                success = function (entry) {
                    getDirectory(entry);
                };
            }
            root.getDirectory(dirArr[counter], {create: true, exclusive: false}, success, error);
            counter++;
        };
    RAD.utils.fileSystem(callbackFn, fail, context);
});
RAD.namespace('RAD.utils.getFile', function (file, callback, fail, context) {
    if(!file){
        return;
    }
    var parts = file.split('/'),
        fileName = parts.pop().toString(),
        dir = parts.join('/'),
        callbackFn = function (DirectoryEntry) {
            DirectoryEntry = DirectoryEntry.root || DirectoryEntry;

            var success = function (entry) {
                    RAD.utils.callback(callback, context, arguments);
                    console.log("download complete: " + entry.toURL());
                },
                error = function (error) {
                    console.log("Failed to retrieve file: " + error.code);
                    RAD.utils.callback(fail, context, arguments);
                };
            DirectoryEntry.getFile(fileName, {create: true}, success, error);
        };

    if (dir === "") {
        RAD.utils.fileSystem(callbackFn, fail, context);
    } else {
        RAD.utils.getDirectory(dir, callbackFn, fail, context);
    }
});
RAD.namespace('RAD.utils.fileSystem', function (callback, fail, context) {
    if (!window.cordova) {
        console.log('File API use cordova');
        RAD.utils.callback(fail, context, [{status : -1}]);
        return;
    }

    var onFileSystemSuccess = function (fileSystem) {
            RAD.utils.callback(callback, context, arguments);
        },
        error = function (error) {
            console.log('RAD.utils.fileSystem ' +  error.code);
            RAD.utils.callback(fail, context, arguments);
        };
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, onFileSystemSuccess, error);
});
RAD.namespace('RAD.utils.callback', function (callback, context, arg) {
    if (typeof callback === 'function') {
        context = context || this;
        callback.apply(context, arg);
    }
});
RAD.namespace('RAD.utils.analytics', function (method, opt) {
    if(!window.analytics){
        console.log('Use application for Google Analytics');
        return;
    }
    if(window.analytics[method]){
        window.analytics[method].apply(this, opt);
    }
});
RAD.namespace('RAD.utils.updateText', function (data) {
    var template = document.createElement('template');
    template.innerHTML = data;
    var fragment = template.content,
        images = fragment.querySelectorAll('img'),
        allElements = fragment.querySelectorAll('*'),
        iframes = fragment.querySelectorAll('iframe'),
        imageParts = [],
        divImg,
        name = '',
        src = '',
        path = '';
    for(var j=0; j<allElements.length; j++){
        allElements[j].removeAttribute('style');
        allElements[j].removeAttribute('class');
        allElements[j].removeAttribute('id');
        if(!$.trim(allElements[j].innerText) && ($.trim(allElements[j].innerHTML) === '&nbsp;')){
            $(allElements[j]).remove();
        }
    }
    for(var i=0; i<images.length; i++)(function(i){
        var parentHTML = images[i].parentNode.innerHTML;
        var wrapperDiv =  document.createElement('div');
        wrapperDiv.className = 'image-wrapper';
        wrapperDiv.innerHTML = parentHTML;
        images[i].parentNode.parentNode.replaceChild(wrapperDiv, images[i].parentNode);
        var image = wrapperDiv.querySelector('img');
        var imagePlaceholder = document.createElement('div');
        imagePlaceholder.className = 'image-placeholder';
        src = image.getAttribute('src');
        divImg = document.createElement('div');
        divImg.className = 'internal-img';
        RAD.utils.download(src, settings.otherImage, this);
        imageParts = src.split('/');
        name = imageParts[imageParts.length-1];
        name = name.split('?')[0];
        path = settings.rootPath ? settings.rootPath + settings.otherImage + '/' + name : src;
        var imgRes = document.createElement('div');
        imgRes.className = 'image-resource';
        if($(image).next() && $(image).next()[0]){
            imgRes.innerHTML = $(image).next()[0].innerText;
            $(image).next().remove();
        }else{
            imgRes.innerHTML = $(wrapperDiv).next() && $(wrapperDiv).next()[0] && $(wrapperDiv).next()[0].innerText;
            $(wrapperDiv).next().remove();
        }
        var imageTitle = $(wrapperDiv.parentNode) && $(wrapperDiv.parentNode).prev(),
            isTitle = imageTitle[0] && /em|h|strong/.test(imageTitle[0].outerHTML),
            newImageTitle = document.createElement('div');
        if(isTitle){
            newImageTitle.className = 'image-title';
            newImageTitle.innerHTML = imageTitle[0].innerText;
            $(newImageTitle).insertBefore(image);
            imageTitle.remove();
        }
        divImg.style.backgroundImage = 'url(' + path + ')';
        image.parentNode.appendChild(imgRes);
        image.setAttribute('src', path);
        imagePlaceholder.appendChild(divImg);
        image.parentNode.replaceChild(imagePlaceholder, image)
    }(i))
    for(var t=0; t<iframes.length; t++){
        var videoWrapper = document.createElement('div');
        var span = document.createElement('span');
        var spanWrapper = document.createElement('span');
        var link = document.createElement('a');
        span.className = 'video';
        videoWrapper.className = 'video-link-wrapper';
        link.className = 'video-link';
        link.target = '_blank';
        var videoSrc = iframes[t].getAttribute('src');
        spanWrapper.className = 'video-wrapper';
        if(videoSrc.indexOf('youtube') !== -1){
            var videoUrlParts = videoSrc.split('/');
            var videoId = videoUrlParts[videoUrlParts.length-1];
            span.style.backgroundImage = "url('http://img.youtube.com/vi/" + videoId + "/0.jpg')";
        }
        link.href = videoSrc;
        spanWrapper.appendChild(span);
        link.appendChild(spanWrapper);
        videoWrapper.appendChild(link);
        iframes[t].parentNode.replaceChild(videoWrapper, iframes[t])
    }
    var videos = fragment.querySelectorAll('.video-link');
    for(var k=0; k<videos.length; k++){
        var videoTitle = $(videos[k].parentNode.parentNode) && $(videos[k].parentNode.parentNode).prev(),
            isVideoTitle = videoTitle[0] && /em|h|strong/.test(videoTitle[0].outerHTML),
            newVideoTitle = document.createElement('div');

        if(isVideoTitle){
            newVideoTitle.className = 'video-title';
            newVideoTitle.innerHTML = videoTitle[0].innerText;
            $(newVideoTitle).insertBefore(videos[k]);
            videoTitle.remove();
        }
    }
    return template.innerHTML
});
RAD.namespace('RAD.utils.formatDate', function (date, mask, useLocalTime) {
    /*
     * http://blog.stevenlevithan.com/archives/date-time-format
     * Date Format 1.2.3
     * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
     * MIT license
     *
     * Includes enhancements by Scott Trenda <scott.trenda.net>
     * and Kris Kowal <cixar.com/~kris.kowal/>
     *
     * Accepts a date, a mask, or a date and a mask.
     * Returns a formatted version of the given date.
     * The date defaults to the current date/time.
     * The mask defaults to dateFormat.masks.default.
     */

    var dateFormat = function () {
        var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {
            var dF = dateFormat;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date;
            if (isNaN(date)) throw SyntaxError("invalid date");


            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var _ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
                D = date[_ + "Day"](),
                m = date[_ + "Month"](),
                y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
                M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
                L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d: d,
                    dd: pad(d),
                    ddd: dF.i18n.dayNames[D],
                    dddd: dF.i18n.dayNames[D + 7],
                    m: m + 1,
                    mm: pad(m + 1),
                    mmm: dF.i18n.monthNames[m],
                    mmmm: dF.i18n.monthNames[m + 12],
                    mmmmR: dF.i18n.monthNamesRus[m],
                    yy: String(y).slice(2),
                    yyyy: y,
                    h: H % 12 || 12,
                    hh: pad(H % 12 || 12),
                    H: H,
                    HH: pad(H),
                    M: M,
                    MM: pad(M),
                    s: s,
                    ss: pad(s),
                    l: pad(L, 3),
                    L: pad(L > 99 ? Math.round(L / 10) : L),
                    t: H < 12 ? "a" : "p",
                    tt: H < 12 ? "am" : "pm",
                    T: H < 12 ? "A" : "P",
                    TT: H < 12 ? "AM" : "PM",
                    Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            if(new Date().getDate() === date.getDate()){
                flags['dd'] = RAD.utils.Dictionary('Сегодня');
                flags['mmmm'] = '';
                flags['yyyy'] = '';
            }
            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    }();

// Some common format strings
    dateFormat.masks = {
        "default": "ddd mmm dd yyyy HH:MM:ss",
        shortDate: "m/d/yy",
        mediumDate: "mmm d, yyyy",
        longDate: "mmmm d, yyyy",
        fullDate: "dddd, mmmm d, yyyy",
        shortTime: "h:MM TT",
        mediumTime: "h:MM:ss TT",
        longTime: "h:MM:ss TT Z",
        isoDate: "yyyy-mm-dd",
        isoTime: "HH:MM:ss",
        isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

// Internationalization strings
    dateFormat.i18n = {
        dayNames: [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"
        ],
        monthNamesRus: [
            RAD.utils.Dictionary("Января"),
            RAD.utils.Dictionary("Февраля"),
            RAD.utils.Dictionary("Марта"),
            RAD.utils.Dictionary("Апреля"),
            RAD.utils.Dictionary("Мая"),
            RAD.utils.Dictionary("Июня"),
            RAD.utils.Dictionary("Июля"),
            RAD.utils.Dictionary("Августа"),
            RAD.utils.Dictionary("Сентября"),
            RAD.utils.Dictionary("Октября"),
            RAD.utils.Dictionary("Ноября"),
            RAD.utils.Dictionary("Декабря")
        ]
    };

// For convenience...
//    Date.prototype.format = function (mask, utc) {
//        return dateFormat(this, mask, utc);
//    };
    if (!date) {
        return '';
    }
    return dateFormat(date, mask, useLocalTime); // by default used UTC time
});
RAD.utils.phrases = {
    ukr:{
        "Написать разработчикам": 'Написати розробникам',
        "новых новостей": 'нових новин',
        "Отсутствует интернет соединение":  "Відсутнє з'єднання з інтернетом",
        "Сегодня": 'Сьогодні',
        "Января":'Січень',
        "Февраля": 'Лютий',
        "Марта": 'Березень',
        "Апреля":'Квітень',
        "Мая":'Травень',
        "Июня": 'Червень',
        "Июля": 'Липень',
        "Августа": 'Серпень',
        "Сентября": 'Вересень',
        "Октября": 'Жовтень',
        "Ноября": 'Листопад',
        "Декабря": 'Грудень'
    },
    rus: {
        "Написать разработчикам": 'Написать разработчикам',
        "новых новостей": 'новых носотей',
        "Отсутствует интернет соединение":  "Отсутствует интернет соединение",
        "Сегодня": 'Сегодня',
        "Января":'Января',
        "Февраля": 'Февраля',
        "Марта": 'Марта',
        "Апреля":'Апреля',
        "Мая":'Мая',
        "Июня": 'Июня',
        "Июля": 'Июля',
        "Августа": 'Августа',
        "Сентября": 'Сентября',
        "Октября": 'Октября',
        "Ноября": 'Ноября',
        "Декабря": 'Декабря'
    }
};
RAD.namespace('RAD.utils.Dictionary', function (phrase) {
    var lang = RAD.models.Settings.get('lang');
    if(!RAD.utils.phrases[lang][phrase]){
        return phrase
    }

    return RAD.utils.phrases[lang][phrase];
});
