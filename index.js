const debug = require('debug')('ogr2pg');

const shell = require('shelljs');
const _ = require('lodash');
const path = require('path');

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {object} Ogr2pgResult
 * @property {string} status - success or error
 * @property {string} message
 * @property {string} command
 */


/**
 *
 * Helper to import spatial files (dbf, shp, geojson, etc.) in PostGIS with
 * ogr2ogr and psql.
 *
 * @param {Object} options parameters
 * @param {string} options.inputPath input file to import
 * @param {string?} options.outputPath Allows to write result to a given file instead of running psql
 * @param {string?} options.encoding input encoding (UTF-8, LATIN1,...)
 * @param {string} options.tableName target table
 * @param {string} [createTable=false] Drop and create table according to file structure
 * @param {string} [schemaName="public"] target schema
 * @param {boolean} [createSchema=false] Create schema
 * @param {boolean} [promoteToMulti=false] Promote geometry to multi-geometry (ex : MultiPolygon)
 *
 * @return {Ogr2pgResult}
 */
async function ogr2pg(options){
    const {
        createTable = false,
        schemaName = 'public',
        createSchema = false,
        promoteToMulti = false,
        skipFailures = false,
        outputPath = null
    } = options;

    return new Promise(function(resolve,reject){
        if (!shell.which('ogr2ogr')) {
            reject({
                'status': 'error',
                'message': 'ogr2ogr not found',
                'command': 'which ogr2ogr'
            });
        }
        if (!shell.which('psql')) {
            reject({
                'status': 'error',
                'message': 'psql not found',
                'command': 'which psql'
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

        if ( skipFailures ){
            commandParts.push('-skipfailures');
        }

        if ( promoteToMulti ){
            commandParts.push('-nlt PROMOTE_TO_MULTI');
        }

        if ( createSchema ){
            commandParts.push('-lco CREATE_SCHEMA=ON');
        }else{
            commandParts.push('-lco CREATE_SCHEMA=OFF');
        }
        commandParts.push('-lco SCHEMA='+schemaName);

        if ( createTable ){
            commandParts.push('-lco DROP_TABLE=ON');
            commandParts.push('-lco CREATE_TABLE=ON');
        }else{
            commandParts.push('-lco DROP_TABLE=OFF');
            commandParts.push('-lco CREATE_TABLE=OFF');
        }

        /* csv specific */
        const inputExtension = path.extname(options.inputPath).toLowerCase();
        if ( inputExtension == '.csv' ){
            commandParts.push('-oo EMPTY_STRING_AS_NULL=YES');
        }

        commandParts.push('-nln '+options.tableName);

        commandParts.push('"'+options.inputPath+'"');

        if ( outputPath ){
            commandParts.push(` > ${outputPath}`);
        }else{
            commandParts.push(' | psql --quiet');
        }

        const command = commandParts.join(' ');
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
