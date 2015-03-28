(function(scope, win){
    var columns = {
        guid: 'INTEGER PRIMARY KEY UNIQUE',
        author: "VARCHAR(100)",
        category: "TEXT",
        comments: "TEXT",
        description: "TEXT",
        image: "VARCHAR(100)",
        link: "TEXT",
        pubDate: "VARCHAR(50)",
        source: "TEXT",
        title: "TEXT",
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
            console.log(query);
            t.executeSql("CREATE TABLE IF NOT EXISTS news (" + query + ")");
        }, function(e){
            console.log(e)
        });
    scope.insertRow = function(data){
        var keys = Object.keys(columns).sort(),
            columnsStr = keys.join(', '),
            dataArr = [],
            valStr = '';

        for(var i=0; i<keys.length; i++){
            dataArr.push(data[keys[i]] || '')
        }
        for(var i=0; i<keys.length; i++){
            valStr += '?';
            if(i !== keys.length-1){
                valStr += ', '
            }
        }
        korDB.transaction(function(t) {
            var queryStr = "INSERT INTO news (" + columnsStr + ") VALUES (" + valStr + ")";
            t.executeSql(queryStr, dataArr);
        }, function(e){
            console.log(e)
        });
    };
    scope.getRows = function(query, callback){
        var result = [];
        korDB.transaction(function(t) {
            t.executeSql(query, [], function(e, rs){
                for(var i=0; i<rs.rows.length; i++) {
                    var row = rs.rows.item(i);
                    result.push(row);
                }
                console.log(result);
            });
        }, function(e){
            console.log(e)
        });
    };
})(RAD.namespace('RAD.utils.sql', {}), this);