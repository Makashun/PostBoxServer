import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const server = express();
server.use(cors());
server.use(express.json());

const conn = mysql.createConnection(
    {
        connectionLimit: 10,
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'StreetBox'
    }
);

let connectionState = 'disconnected';
let connectionError = null;
const connectionWaiters = [];
conn.on('error', (err) => {
    console.error('MySQL Global Error Triggered:', err.message);
    connectionError = err;
    connectionState = 'failed'; 

   
    if (connectionWaiters.length > 0) {
        connectionWaiters.splice(0).forEach((waiter) => waiter(err));
    }
});

//check Mysql Database Connection
function ensureConnected(callback) {
    if (connectionState === 'connected') {
        callback(null);
        return;
    }
    if (connectionState === 'failed') {
        callback(connectionError);
        return;
    }

    connectionWaiters.push(callback);
    if (connectionState === 'connecting') {
        return;
    }

    connectionState = 'connecting';
    conn.connect((err) => {
        connectionError = err;
        connectionState = err ? 'failed' : 'connected';
        connectionWaiters.splice(0).forEach((waiter) => waiter(err));
    });
}

// Function to add time filters to the SQL query
function addTimeFilters(query, queryParams, before, after, day = 'weekday') {
    const collectionTimeField = day === 'saturday'
        ? 'saturdayCollectionTime'
        : 'weekdayCollectionTime';

    if (after) {
        query += ` AND ${collectionTimeField} > ?`;
        queryParams.push(after);
    }
    if (before) {
        query += ` AND ${collectionTimeField} < ?`;
        queryParams.push(before);
    }

    return { query, queryParams };
}

//GET API（Read)
//1.1 retrieve all records
//GET http://localhost:8888/
server.get(
    '/', (request, response) => {
        console.log('GET /');
        ensureConnected((err) => {
            if (err) {
                console.error('Database connection error:', err);
                response.send(getErrorResponse('8000', 'Database connection error'));
                response.end();
                return;
            }
            let query = 'SELECT * FROM StreetBox WHERE 1 = 1';
            let queryParams = [];
            ({ query, queryParams } = addTimeFilters(
                query, queryParams, request.query.before, request.query.after, request.query.day
            ));
            conn.query(query, queryParams, (err, results) => {
                if (err) {
                    response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                    response.end();
                    return;
                }
                response.send(getSuccessResponse(results, results.length + ' record(s) retrieved'));
                response.end();
            });
        });
    }
);

//1.2 retrieve a record by District (districtEN, districtTC, districtSC)
//GET http://localhost:8888/district/{districtName}
//Option Query: /district/{districtName}?day=weekday&before=13:00&after=09:00
server.get(
    '/district/:district', (request, response) => {
        console.log('GET /district');
        if (typeof request.params.district === 'undefined') {
            response.send(getErrorResponse('2000', 'Missing parameter: district'));
            response.end();
            return;
        }
        ensureConnected((err) => {
            if (err) {
                response.send(getErrorResponse('8000', 'Database connection error'));
                console.error('Database connection error:', err);
                response.end();
                return;
            }
            let query = 'SELECT * FROM StreetBox WHERE (districtEN like ? OR districtTC like ? OR districtSC like ?)';
            let queryParams = [
                '%' + request.params.district + '%',
                '%' + request.params.district + '%',
                '%' + request.params.district + '%'
            ];
            ({ query, queryParams } = addTimeFilters(
                query, queryParams, request.query.before, request.query.after, request.query.day
            ));
            conn.query(query, queryParams,
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    if (results.length === 0) {
                        response.send(getErrorResponse('1000', 'No record found for district: ' + request.params.district));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.length + ' record(s) retrieved for district: ' + request.params.district));
                    response.end();
                }
            );
        });
    }
);

//1.3 retrieve a record by region (regionEN, regionTC, regionSC)
//GET http://localhost:8888/region/{regionName}
//Option Query: /region/{regionName}?day=weekday&before=13:00&after=09:00
server.get(
    '/region/:region', (request, response) => {
        console.log('GET /region');
        if (typeof request.params.region === 'undefined') {
            response.send(getErrorResponse('2000', 'Missing parameter: region'));
            response.end();
            return;
        }
        ensureConnected((err) => {
            if (err) {
                response.send(getErrorResponse('8000', 'Database connection error'));
                console.error('Database connection error:', err);
                response.end();
                return;
            }
            let query = 'SELECT * FROM StreetBox WHERE (regionEN like ? OR regionTC like ? OR regionSC like ?)';
            let queryParams = [
                '%' + request.params.region + '%',
                '%' + request.params.region + '%',
                '%' + request.params.region + '%'
            ];
            ({ query, queryParams } = addTimeFilters(
                query, queryParams, request.query.before, request.query.after, request.query.day
            ));
            conn.query(query, queryParams,
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    if (results.length === 0) {
                        response.send(getErrorResponse('1000', 'No record found for region: ' + request.params.region));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.length + ' record(s) retrieved for region: ' + request.params.region));
                    response.end();
                }
            );
        });
    }
);

//1.4 retrieve a record by Location (locationEN, locationTC, locationSC)
//GET http://localhost:8888/location/{locationName}
//Option Query: /location/{locationName}?day=weekday&before=13:00&after=09:00
server.get(
    '/location/:location', (request, response) => {
        console.log('GET /location');
        if (typeof request.params.location === 'undefined') {
            response.send(getErrorResponse('2000', 'Missing parameter: location'));
            response.end();
            return;
        }
        ensureConnected((err) => {
            if (err) {
                response.send(getErrorResponse('8000', 'Database connection error'));
                console.error('Database connection error:', err);
                response.end();
                return;
            }
            let query = 'SELECT * FROM StreetBox WHERE (locationEN like ? OR locationTC like ? OR locationSC like ?)';
            let queryParams = [
                '%' + request.params.location + '%',
                '%' + request.params.location + '%',
                '%' + request.params.location + '%'
            ];
            ({ query, queryParams } = addTimeFilters(
                query, queryParams, request.query.before, request.query.after, request.query.day
            ));
            conn.query(query, queryParams,
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    if (results.length === 0) {
                        response.send(getErrorResponse('1000', 'No record found for location: ' + request.params.location));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.length + ' record(s) retrieved for location: ' + request.params.location));
                    response.end();
                }
            );
        });
    }
);

//1.4 retrieve a record by ID
//GET http://localhost:8888/id/{id}
server.get(
    '/id/:id', (request, response) => {
        console.log('GET /id');
        if (typeof request.params.id === 'undefined') {
            response.send(getErrorResponse('2000', 'Missing parameter: id'));
            response.end();
            return;
        }
        ensureConnected((err) => {
            if (err) {
                response.send(getErrorResponse('8000', 'Database connection error'));
                console.error('Database connection error:', err);
                response.end();
                return;
            }
            conn.query('SELECT * FROM StreetBox WHERE id = ?', [request.params.id],
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    if (results.length === 0) {
                        response.send(getErrorResponse('1000', 'No record found for id: ' + request.params.id));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.length + ' record(s) retrieved for id: ' + request.params.id));
                    response.end();
                }
            );
        });
    }
);


//POST API(Create)
//1. create a new record
//POST http://localhost:8888/
server.post(
    '/', (request, response) => {
        console.log('POST /');
        const {
            locationEN, locationTC, locationSC,
            districtEN, districtTC, districtSC,
            regionEN, regionTC, regionSC,
            boxNo, latitude, longitude,
            weekdayCollectionTime, saturdayCollectionTime
        } = request.body;

        ensureConnected((err) => {
            if (err) {
                console.error('Database connection error:', err);
                response.send(getErrorResponse('8000', 'Database connection error'));
                response.end();
                return;
            }
            conn.query(
                `INSERT INTO StreetBox
                 (locationEN, locationTC, locationSC,
                  districtEN, districtTC, districtSC,
                  regionEN, regionTC, regionSC,
                  boxNo, latitude, longitude,
                  weekdayCollectionTime, saturdayCollectionTime)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [locationEN, locationTC, locationSC,
                 districtEN, districtTC, districtSC,
                 regionEN, regionTC, regionSC,
                 boxNo, latitude, longitude,
                 weekdayCollectionTime, saturdayCollectionTime],
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.affectedRows + ' record inserted'));
                    response.end();
                }
            );
        });
    }
);


//PUT API(Update)
//1. update a record by id
//PUT http://localhost:8888/{id}
server.put(
    '/:id', (request, response) => {
        console.log('PUT /');
        if (typeof request.params.id === 'undefined') {
            response.send(getErrorResponse('2000', 'Missing parameter: id'));
            response.end();
            return;
        }
        const {
            locationEN, locationTC, locationSC,
            districtEN, districtTC, districtSC,
            regionEN, regionTC, regionSC,
            boxNo, latitude, longitude,
            weekdayCollectionTime, saturdayCollectionTime
        } = request.body;
        
        const fields = ['locationEN', 'locationTC', 'locationSC',
                  'districtEN', 'districtTC', 'districtSC',
                  'regionEN', 'regionTC', 'regionSC',
                  'boxNo', 'latitude', 'longitude',
                  'weekdayCollectionTime', 'saturdayCollectionTime'];
        let setSQL = '';
        let setValues = [];
        for (let field of fields) {
            if (typeof request.body[field] !== 'undefined') {
                //field is provided, include it in the update
                setSQL += `${field} = ?, `;
                setValues.push(request.body[field]);
            }
        }
        setSQL = setSQL.slice(0, -2); //remove the last comma and space

        if (setValues.length === 0) {
            response.send(getErrorResponse('2000', 'No fields provided to update'));
            response.end();
            return;
        }


        ensureConnected((err) => {
            if (err) {
                console.error('Database connection error:', err);
                response.send(getErrorResponse('8000', 'Database connection error'));
                response.end();
                return;
            }
            conn.query(
                `UPDATE StreetBox
                 SET ${setSQL}
                 WHERE id = ?`,
                [...setValues, request.params.id],
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    if (results.affectedRows === 0) {
                        response.send(getErrorResponse('1000', 'No record found for id: ' + request.params.id));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.affectedRows + ' record updated for id: ' + request.params.id));
                    response.end();
                }
            );
        });
    }
);

//DELETE API
//1. delete a record by id
//DELETE http://localhost:8888/{id}
server.delete(
    '/:id', (request, response) => {
        console.log('DELETE /');
        if (typeof request.params.id === 'undefined') {
            response.send(getErrorResponse('2000', 'Missing parameter: id'));
            response.end();
            return;
        }
        ensureConnected((err) => {
            if (err) {
                console.error('Database connection error:', err);
                response.send(getErrorResponse('8000', 'Database connection error'));
                response.end();
                return;
            }
            conn.query('DELETE FROM StreetBox WHERE id = ?',
                [request.params.id],
                (err, results) => {
                    if (err) {
                        response.send(getErrorResponse('9000', 'SQL error: ' + err.message));
                        response.end();
                        return;
                    }
                    if (results.affectedRows === 0) {
                        response.send(getErrorResponse('1000', 'No record found for id: ' + request.params.id));
                        response.end();
                        return;
                    }
                    response.send(getSuccessResponse(results, results.affectedRows + ' record deleted for id: ' + request.params.id));
                    response.end();
                }
            );
        });
    }
);

function getErrorResponse(errcode, errmsg) {
    let reply = {
        header: {
            success: false,
            errcode: errcode,
            errmsg: errmsg
        }
    };
    return reply;
}

function getSuccessResponse(record, message) {
    let reply = {
        header: {
            success: true,
            message: message,
            errcode: '0000',
            errmsg: 'No error found'
        },
        record: record
    };
    return reply;
}

server.listen(8888, () => {
    console.log('Server is running on port 8888');
});
