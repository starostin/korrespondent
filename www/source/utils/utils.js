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
RAD.namespace('RAD.utils.download', function(link, folder, context, obj){
    if(!window.cordova) {
        console.log('Download plugin use cordova');
        return;
    }
    var $deferred = $.Deferred(),
        callbackFn = function(entry){
            var fileTransfer = new FileTransfer();
            var uri = encodeURI(link),
                filename = (function () {
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
                    obj[folder + 'NativeURL'] = entry.nativeURL;
                    $deferred.resolve(obj)
                },
                function(error) {
                    console.log("download error source " + error.source);
                    console.log("download error target " + error.target);
                    console.log("upload error code" + error.code);
                    obj[folder + 'NativeURL'] = '';
                    $deferred.resolve(obj)
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
    //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, error);
});
RAD.namespace('RAD.utils.callback', function (callback, context, arg) {
    if (typeof callback === 'function') {
        context = context || this;
        callback.apply(context, arg);
    }
});
RAD.namespace('RAD.utils.updateText', function (data) {
    var template = document.createElement('template');
    template.innerHTML = data.fullText;
    var fragment = template.content;
    var imgs = fragment.querySelectorAll('img'),
        imgLinks = [],
        when = [],
        $deferred = $.Deferred();

    for(var i=0; i<imgs.length; i++)(function(i){
        var obj = {};
        RAD.utils.download(imgs[i].getAttribute('src'), settings.otherImage, this, obj).done(function(e){
            imgs[i].setAttribute('src', e['otherImagesNativeURL']);
            data.fullText = template.innerHTML;
            console.log(data)
            RAD.utils.sql.insertRows([data], 'news');
        });
    }(i))


});
