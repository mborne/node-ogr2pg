const debug = require('debug')('ogr2pg');

const shell = require('shelljs');
const _ = require('lodash');
const path = require('path');

/**
 *
 * Helper to import spatial files (dbf, shp, geojson, etc.) in PostGIS with
 * ogr2ogr and psql.
 *
 * @param {Object} options parameters
 * @param {String} options.inputPath input file to import
 * @param {String} [options.encoding="UTF-8"] input encoding (UTF-8, LATIN1,...)
 * @param {String} options.tableName target table
 * @param {Boolean} [options.createTable=false] Drop and create table according to file structure
 * @param {String} [options.schemaName="public"] target schema
 * @param {Boolean} [options.createSchema=false] Create schema
 * @param {Boolean} [options.promoteToMulti=false] Promote geometry to multi-geometry (ex : MultiPolygon)
 * @return {Promise}
 */
function ogr2pg(options){
    var options = _.defaults(options,{
        createTable: false,
        schemaName: 'public',
        createSchema: false,
        promoteToMulti: false,
        skipFailures: false
    });

    return new Promise(function(resolve,reject){
        if (!shell.which('ogr2ogr')) {
            reject({
                'status': 'error',
                'message': 'ogr2ogr not found'
            });
        }
        if (!shell.which('psql')) {
            reject({
                'status': 'error',
                'message': 'psql not found'
            });
        }

        var commandParts = [];
        if ( options.encoding ){
            commandParts.push('SHAPE_ENCODING="'+options.encoding+'"');
        }

        commandParts.push('ogr2ogr');

        commandParts.push('--config PG_USE_COPY YES');
        commandParts.push('-f PGDump /vsistdout/');
        commandParts.push('-lco GEOMETRY_NAME=geom');

        commandParts.push('-t_srs EPSG:4326');

        commandParts.push('-lco precision=NO');

        if ( options.skipFailures ){
            commandParts.push('-skipfailures');
        }

        if ( options.promoteToMulti ){
            commandParts.push('-nlt PROMOTE_TO_MULTI');
        }

        if ( options.createSchema ){
            commandParts.push('-lco CREATE_SCHEMA=ON');
        }else{
            commandParts.push('-lco CREATE_SCHEMA=OFF');
        }
        commandParts.push('-lco SCHEMA='+options.schemaName);

        if ( options.createTable ){
            commandParts.push('-lco DROP_TABLE=ON');
            commandParts.push('-lco CREATE_TABLE=ON');
        }else{
            commandParts.push('-lco DROP_TABLE=OFF');
            commandParts.push('-lco CREATE_TABLE=OFF');
        }

        /* csv specific */
        if ( path.extname(options.inputPath) === 'csv' ){
            commandParts.push('-oo EMPTY_STRING_AS_NULL=YES');
        }

        commandParts.push('-nln '+options.tableName);

        commandParts.push('"'+options.inputPath+'"');

        var command = commandParts.join(' ')+' | psql --quiet';
        debug(command);
        if (shell.exec(command).code !== 0) {
            reject({
                'status': 'error',
                'message': 'Fail to import '+options.inputPath,
                'command': command
            });
        }else{
            resolve({
                'status': 'success',
                'message': 'File imported : '+options.inputPath,
                'command': command
            });
        }
    });
};

module.exports = ogr2pg;
