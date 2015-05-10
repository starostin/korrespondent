(function(scope, win){
    var columns = {
        ident: "VARCHAR(50) UNIQUE",
        favorite: "INTEGER",
        guid: "VARCHAR(50)",
        author: "VARCHAR(100)",
        category: "TEXT",
        comments: "TEXT",
        description: "TEXT",
        fullText: "TEXT",
        image: "VARCHAR(100)",
        bigImage: "VARCHAR(100)",
        link: "TEXT",
        imagesNativeURL: "VARCHAR(100)",
        bigImagesNativeURL: "VARCHAR(100)",
        pubDate: "VARCHAR(50)",
        source: "TEXT",
        title: "TEXT",
        buffer: "INTEGER",
        newsId: "INTEGER",
        lang: "VARCHAR(5)"
    };
        //Create the database the parameters are 1. the database name 2.version number 3. a description 4. the size of the database (in bytes) 1024 x 1024 = 1MB
        var korDB = openDatabase("korrespondent_db", "0.1", "A Database of news", 1024 * 1024);
        korDB.transaction(function(t) {
            var query = '',
                keys = Object.keys(columns);

            for(var i=0; i<keys.length; i++){
                query += keys[i];
                query += ' ';
                query += columns[keys[i]];
                if(i !== keys.length-1){
                    query += ', ';
                }
            }
            t.executeSql("CREATE TABLE IF NOT EXISTS news (" + query + ")");
        }, function(e){
            console.log(e)
        });
    scope.insertRows = function(data, table){
        var keys = Object.keys(columns).sort(),
            $deferred = $.Deferred(),
            $allDeferred = $.Deferred(),
            columnsStr = keys.join(', '),
            promisesArr = [],
            valStr = '';

        for(var i=0; i<keys.length; i++){
            valStr += '?';
            if(i !== keys.length-1){
                valStr += ', '
            }
        }
        for(var j=0; j<data.length; j++)(function(j){
            if(data[j].fullText){
                data[j].fullText = RAD.utils.updateText(data[j].fullText)
            }
            data[j].lang = RAD.models.Settings.get('lang');
            data[j].newsId = data[j].newsId || +RAD.models.Settings.get('selectedSubCategory');
            data[j].ident = data[j].guid + '_' + data[j].newsId + '_' + data[j].lang;
            promisesArr.push(
                korDB.transaction(function(t) {
                    var dataArr = [];
                    for(var k=0; k<keys.length; k++){
                        dataArr.push(data[j][keys[k]] === undefined ? '' : data[j][keys[k]])
                    }
                    var queryStr = "INSERT OR REPLACE INTO " + table + " (" + columnsStr + ") VALUES (" + valStr + ")";
                    t.executeSql(queryStr, dataArr, function(e, rs){
                        $deferred.resolve(e, rs)
                    });
                }, function(e){
                    $deferred.reject(e)
                }));
        })(j)
        $.when.apply($, promisesArr).then(function(){
            $allDeferred.resolve();
        });
        return $allDeferred.promise();
    };
    scope.getRows = function(query){
        console.log(query)
        var result = [],
            $deferred = $.Deferred();

        korDB.transaction(function(t) {
            t.executeSql(query, [], function(e, rs){
                for(var i=0; i<rs.rows.length; i++) {
                    var row = rs.rows.item(i);
                    result.push(row);
                }
                $deferred.resolve(result, e)
            });
        }, function(e){
            $deferred.reject()
        });
        return $deferred.promise();
    };
})(RAD.namespace('RAD.utils.sql', {}), this);