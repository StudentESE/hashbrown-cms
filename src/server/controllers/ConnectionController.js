'use strict';

// Classes
let ApiController = require('./ApiController');

/**
 * The Controller for Connections
 */
class ConnectionController extends ApiController {
    /**
     * Initialises this controller
     */
    static init(app) {
        app.get('/api/:project/:environment/connections', this.middleware(), this.getConnections);
        app.get('/api/:project/:environment/connections/:id', this.middleware(), this.getConnection);
        
        app.post('/api/:project/:environment/connections/new', this.middleware({scope: 'connections'}), this.createConnection);
        app.post('/api/:project/:environment/connections/pull/:id', this.middleware(), this.pullConnection);
        app.post('/api/:project/:environment/connections/push/:id', this.middleware(), this.pushConnection);
        app.post('/api/:project/:environment/connections/:id', this.middleware({scope: 'connections'}), this.postConnection);
        
        app.delete('/api/:project/:environment/connections/:id', this.middleware({scope: 'connections'}), this.deleteConnection);
    }        
    
    /**
     * Gets all connections
     */
    static getConnections(req, res) {
        ConnectionHelper.getAllConnections()
        .then((connections) => {
            res.send(connections);
        })
        .catch((e) => {
            res.status(502).send(ConnectionController.printError(e));
        });
    }

    /**
     * Post connection by id
     */
    static postConnection(req, res) {
        let id = req.params.id;
        let connection = req.body;

        ConnectionHelper.setConnectionById(id, connection)
        .then(() => {
            res.status(200).send(connection);
        })
        .catch((e) => {
            res.status(502).send(ConnectionController.printError(e));
        });
    }
    
    /**
     * Pulls Connection by id
     */
    static pullConnection(req, res) {
        let id = req.params.id;

        SyncHelper.getResourceItem('connections', id)
        .then((resourceItem) => {
            if(!resourceItem) { return Promise.reject(new Error('Couldn\'t find remote Connection "' + id + '"')); }
        
            return ConnectionHelper.setConnectionById(id, resourceItem, true)
            .then((newConnection) => {
                res.status(200).send(id);
            });
        })
        .catch((e) => {
            res.status(404).send(ConnectionController.printError(e));   
        }); 
    }
    
    /**
     * Pushes Connection by id
     */
    static pushConnection(req, res) {
        let id = req.params.id;

        ConnectionHelper.getConnectionById(id)
        .then((localConnection) => {
            return SyncHelper.setResourceItem('connection', id, localConnection);
        })
        .then(() => {
            return ConnectionHelper.removeConnectionById(id);
        })
        .then(() => {
            res.status(200).send(id);
        })
        .catch((e) => {
            res.status(404).send(ConnectionController.printError(e));   
        }); 
    }

    
    /**
     * Gets a connection by id
     */
    static getConnection(req, res) {
        let id = req.params.id;
   
        if(id && id != 'undefined') {
            ConnectionHelper.getConnectionById(id)
            .then((connection) => {
                res.send(connection);
            })
            .catch((e) => {
                res.status(502).send(ConnectionController.printError(e));
            });
        
        } else {
            res.status(400).send('Connection id is not provided');
        
        }
    }
    
    /**
     * Creates a new connection
     *
     * @return {Object} Content
     */
    static createConnection(req, res) {
        ConnectionHelper.createConnection()
        .then((connection) => {
            res.status(200).send(connection);
        })
        .catch((e) => {
            res.status(502).send(ConnectionController.printError(e));
        });
    }

    /**
     * Deletes a connection by id
     */
    static deleteConnection(req, res) {
        let id = req.params.id;
        
        ConnectionHelper.removeConnectionById(id)
        .then(() => {
            res.status(200).send(id);
        })
        .catch((e) => {
            res.status(502).send(ConnectionController.printError(e));
        });
    }
}

module.exports = ConnectionController;
