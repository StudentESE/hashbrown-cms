'use strict';

/**
 * The helper class for all synchronisation services
 */
class SyncHelper {
    /**
     * Gets a new token
     *
     * @param {String} project
     * @param {String} username
     * @param {String} password
     *
     * @returns {Promise} New token
     */
    static renewToken(
        project = requiredParam('project'),
        username = requiredParam('username'),
        password = requiredParam('password')
    ) {
        return SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            debug.log('Renewing sync token for ' + project + '...', this);

            return new Promise((resolve, reject) => {
                let headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                };
                
                let postData = {
                    username: username,
                    password: password
                };
                    
                RequestHelper.post(settings.url + 'user/login?persist=true', {
                    headers: headers,
                    data: JSON.stringify(postData)
                }).on('complete', (data, response) => {
                    if(typeof data !== 'string' || data.length !== 40) {
                        reject(data);
                    
                    } else {
                        debug.log('Sync token renewed successfully', this);
                        
                        resolve(data);
                    
                    }
                });
            });
        });
    }
    
    /**
     * Get resource item
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {String} remoteItemName
     *
     * @returns {Promise} Resource
     */
    static getResourceItem(
        project = requiredParam('project'),
        environment = requiredParam('environment'),
        remoteResourceName = requiredParam('remoteResourceName'),
        remoteItemName = requiredParam('remoteItemName')
    ) {
        if(!remoteItemName) {
            return SyncHelper.getResource(project, environment, remoteResourceName);
        }

        return SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            return new Promise((resolve, reject) => {
                if(settings && settings.enabled) {
                    let headers = {
                        'Accept': 'application/json'
                    };
                    
                    let path = settings.project;
                    
                    if(environment) {
                        path += '/' + environment;
                    }

                    let resource = remoteResourceName + '/' + remoteItemName;

                    debug.log('Requesting remote resource item ' + resource + ' for ' + path + '...', this, 3);

                    RequestHelper.get(settings.url + path + '/' + resource + '?token=' + settings.token, {
                        headers: headers
                    }).on('complete', (data, response) => {
                        if(data instanceof Error) {
                            reject(data);

                        } else if(typeof data === 'string') {
                            reject(new Error(data));
                        
                        } else {
                            if(data instanceof Object) {
                                data.locked = true;
                                data.remote = true;
                                data.local = false;
                            }

                            debug.log('Remote resource item ' + resource + ' retrieved successfully', this, 3);
                            
                            resolve(data);
                        }
                    });

                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Set resource item
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {String} remoteItemName
     * @param {Object} remoteItemData
     *
     * @returns {Promise} Whether setting was successful
     */
    static setResourceItem(
        project = requiredParam('project'),
        environment = requiredParam('environment'),
        remoteResourceName = requiredParam('remoteResourceName'),
        remoteItemName = requiredParam('remoteItemName'),
        remoteItemData = requiredParam('remoteItemData')
    ) {
        return SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            return new Promise((resolve, reject) => {
                if(settings && settings.enabled) {
                    let path = settings.project;
                    
                    if(environment) {
                        path += '/' + environment;
                    }
                    
                    let resource = remoteResourceName;
                    
                    if(remoteItemName) {
                        resource += '/' + remoteItemName;
                    }
                    
                    debug.log('Posting remote resource item ' + resource + ' for ' + path + '...', this, 3);
                   
                    let headers = {
                        'Content-Type': 'application/json'
                    };
                   
                    // Send the API request, and make sure to create/upsert any resources that do not yet exist on the remote 
                    RequestHelper.post(settings.url + path + '/' + resource + '?create=true&token=' + settings.token, {
                        headers: headers,
                        data: JSON.stringify(remoteItemData)
                    }).on('complete', (data, response) => {
                        if(data instanceof Error) {
                            reject(data);

                        } else if(typeof data === 'string') {
                            reject(new Error(data));
                        
                        } else {
                            debug.log('Remote resource item ' + resource + ' posted successfully', this, 3);
                            
                            resolve(true);
                        }
                    });

                } else {
                    resolve(false);
                }
            });
        });
    }

    /**
     * Get resource
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {Object} params
     *
     * @returns {Promise} Resource
     */
    static getResource(
        project = requiredParam('project'),
        environment = requiredParam('environment'),
        remoteResourceName = requiredParam('remoteResourceName'),
        params = {}
    ) {
        return SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            return new Promise((resolve, reject) => {
                if(settings && settings.enabled) {
                    let path = settings.project;
                    
                    if(environment) {
                        path += '/' + environment;
                    }
                    
                    debug.log('Requesting remote resource ' + remoteResourceName + ' for ' + path + '...', this, 3);
                    
                    params.token = settings.token;

                    let headers = {
                        'Accept': 'application/json'
                    };
                  
                    let now = Date.now();

                    RequestHelper.get(settings.url + path + '/' + remoteResourceName, {
                        headers: headers,
                        query: params
                    }).on('complete', (data, response) => {
                        if(data instanceof Error) {
                            reject(data);
                        
                        } else if(typeof data === 'string') {
                            reject(new Error(data));
           
                        } else {
                            debug.log('Remote resource ' + remoteResourceName + ' retrieved successfully', this, 3);
                            
                            resolve(data);
                        
                        }
                    });

                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Merges a resource with a synced one
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {Array} localResource
     * @param {Object} params
     *
     * @return {Promise} Merged resource
     */
    static mergeResource(
        project = requiredParam('project'),
        environment = requiredParam('environment'),
        remoteResourceName = requiredParam('remoteResourceName'),
        localResource = requiredParam('localResource'),
        params = {}
    ) {
        return this.getResource(project, environment, remoteResourceName, params)
        .then((remoteResource) => {
            let mergedResource;

            if(remoteResource) {
                // Cache ids to look for duplicates
                let remoteIds = {};
                let duplicateIds = {};
                
                for(let r in remoteResource) {
                    let remoteItem = remoteResource[r];

                    if(!remoteItem) {
                        debug.log('"' + r + '" in remote resource "' + remoteResourceName + '" is null', this);

                    } else if(typeof remoteItem !== 'object') {
                        debug.log('"' + r + '" in remote resource "' + remoteResourceName + '" is not an object: ' + remoteItem, this);

                    } else {
                        remoteItem.locked = true;
                        remoteItem.remote = true;
                        remoteItem.local = false;

                        remoteIds[remoteItem.id] = true;

                    }
                }

                // Look for duplicates and flag local nodes
                for(let l in localResource) {
                    let localItem = localResource[l];

                    if(remoteIds[localItem.id] == true) {
                        localItem.remote = false;
                        localItem.locked = false;
                        localItem.local = true;

                        duplicateIds[localItem.id] = true;
                    }
                }

                // Merge resources
                if(remoteResource instanceof Array && localResource instanceof Array) {
                    mergedResource = [];
                    
                    for(let v of remoteResource) {
                        if(duplicateIds[v.id] == true) { continue; }

                        mergedResource[mergedResource.length] = v;
                    }
                    
                    for(let v of localResource) {
                        mergedResource[mergedResource.length] = v;
                    }
                
                } else if(remoteResource instanceof Object && localResource instanceof Object) {
                    mergedResource = {};
                    
                    for(let k in remoteResource) {
                        mergedResource[k] = remoteResource[k];
                    }
                    
                    for(let k in localResource) {
                        mergedResource[k] = localResource[k];
                    }
                
                } else {
                    return Promise.reject(new Error('Local and remote resources in "' + remoteResourceName + '" are not of same type'));
                
                }
            
            } else {
                mergedResource = localResource;

            }

            return new Promise((resolve) => {
                resolve(mergedResource);
            });
        });
    }
}

module.exports = SyncHelper;
