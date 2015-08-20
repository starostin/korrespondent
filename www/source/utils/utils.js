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
RAD.namespace('RAD.utils.updateText', function (data) {
    var template = document.createElement('template');
    template.innerHTML = data;
    var fragment = template.content,
        images = fragment.querySelectorAll('img'),
        allElements = fragment.querySelectorAll('*'),
        iframes = fragment.querySelectorAll('iframe'),
        imageParts = [],
        name = '',
        src = '',
        path = '';
    for(var j=0; j<allElements.length; j++){
        allElements[j].removeAttribute('style');
        allElements[j].removeAttribute('class');
        allElements[j].removeAttribute('id');
    }
    for(var i=0; i<images.length; i++)(function(i){
        src = images[i].getAttribute('src');
        RAD.utils.download(src, settings.otherImage, this);
        imageParts = src.split('/');
        name = imageParts[imageParts.length-1];
        name = name.split('?')[0];
        path = settings.rootPath ? settings.rootPath + settings.otherImage + '/' + name : src;
        images[i].parentNode.classList.add('image-wrapper');
        images[i].setAttribute('src', path);
    }(i))
    for(var t=0; t<iframes.length; t++){
        var span = document.createElement('span');
        var spanWrapper = document.createElement('span');
        var link = document.createElement('a');
        span.className = 'video';
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
        iframes[t].parentNode.replaceChild(link, iframes[t])
    }
    return template.innerHTML
});
