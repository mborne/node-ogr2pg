import { expect } from 'chai';

// NodeJS 20.x
const __dirname = import.meta.dirname;

import { existsSync, readFileSync } from 'fs';

import ogr2pg from '../index.js';

describe('test ogr2pg', async function () {
    it('should produce expected file for sample.json', async function () {
        const inputPath = __dirname + '/sample.json';
        const outputPath = '/tmp/sample.sql';
        const result = await ogr2pg({
            inputPath: inputPath,
            tableName: 'sample',
            outputPath: outputPath
        });
        expect(result.status).to.equal('success');
        const expectedCommand = `ogr2ogr --config PG_USE_COPY YES -f PGDump /vsistdout/ -lco GEOMETRY_NAME=geom -t_srs EPSG:4326 -lco precision=NO -lco CREATE_SCHEMA=OFF -lco SCHEMA=public -lco DROP_TABLE=OFF -lco CREATE_TABLE=OFF -nln sample "${inputPath}"  > ${outputPath}`;
        expect(result.command).to.equal(expectedCommand);

        expect(existsSync(outputPath)).to.equal(true);
        const sqlContent = readFileSync(outputPath, 'utf-8');
        expect(sqlContent).to.contains('BEGIN;');
        expect(sqlContent).to.contains('COPY "public"."sample" ("geom", "id", "name") FROM STDIN;');
        // POINT(1 2)
        expect(sqlContent).to.contains('0101000020E6100000000000000000F03F0000000000000040');
        expect(sqlContent).to.contains('COMMIT;');
    });


    it('should produce expected file for sample.json with some options', async function () {
        const inputPath = __dirname + '/sample.json';
        const outputPath = '/tmp/sample-options.sql';
        const result = await ogr2pg({
            inputPath: inputPath,
            tableName: 'sample',
            outputPath: outputPath,
            createSchema: true,
            schemaName: 'test',
            createTable: true,
            skipFailures: true,
            promoteToMulti: true
        });
        expect(result.status).to.equal('success');
        const expectedCommand = `ogr2ogr --config PG_USE_COPY YES -f PGDump /vsistdout/ -lco GEOMETRY_NAME=geom -t_srs EPSG:4326 -lco precision=NO -skipfailures -nlt PROMOTE_TO_MULTI -lco CREATE_SCHEMA=ON -lco SCHEMA=test -lco DROP_TABLE=ON -lco CREATE_TABLE=ON -nln sample "${inputPath}"  > ${outputPath}`;
        expect(result.command).to.equal(expectedCommand);

        expect(existsSync(outputPath)).to.equal(true);
        const sqlContent = readFileSync(outputPath, 'utf-8');

        // depends on ogr2ogr version?
        //expect(sqlContent).to.contains('DROP TABLE "test"."sample" CASCADE;"');
        expect(sqlContent).to.contains('CREATE TABLE "test"."sample"');

        expect(sqlContent).to.contains('BEGIN;');
        expect(sqlContent).to.contains('COPY "test"."sample" ("geom", "id", "name") FROM STDIN;');
        // MULTIPOINT((1 2)) with promoteToMulti: true
        expect(sqlContent).to.contains('0104000020E6100000010000000101000000000000000000F03F0000000000000040');
        expect(sqlContent).to.contains('COMMIT;');
    });


});
