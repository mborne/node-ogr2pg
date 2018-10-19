# node-ogr2pg

## Description

Provides an helper to invoke [ogr2ogr](https://www.gdal.org/ogr2ogr.html) and [psql](https://www.postgresql.org/docs/current/static/app-psql.html) to import spatial file into [PostGIS](https://postgis.net/).

## Usage

```js
const ogr2pg = require('@mborne/ogr2pg');

ogr2pg({
    'inputPath': 'place.shp',
    'tableName': 'place'
}).then(function(){
    console.log("Table public.place created from 'place.shp'");
}).catch(function(err){
    console.log(err.message);
});
```

## Options

| Name             | Required? | Description                                                      | Default  |
| ---------------- | :-------: | ---------------------------------------------------------------- | -------- |
| `inputPath`      | YES       | Input file path (.shp, .geojson, etc.)                           |          |
| `encoding`       | NO        | Input encoding (UTF-8, LATIN1,...)                               | `UTF-8`  |
| `tableName`      | YES       | Output table name                                                |          |
| `createTable`    | NO        | Automatically create table (drop table if exists)                | `false`  |
| `schemaName`     | NO        | Output schema name                                               | `public` |
| `createSchema`   | NO        | Automatically create schema if not exists                        | `false`  |
| `promoteToMulti` | NO        | Promote geometry to multi (ex : MultiPolygon instead of Polygon) | `false`  |

## License

[MIT](LICENSE)
