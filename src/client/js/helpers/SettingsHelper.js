'use strict';

let SettingsHelperCommon = require('../../../common/helpers/SettingsHelper');

class SettingsHelper extends SettingsHelperCommon {
    /**
     * Gets all settings
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} section
     *
     * @return {Promise(Object)}  settings
     */
    static getSettings(
        project = requiredParam('project'),
        environment = null,
        section = null
    ) {
        if(environment === '*') { environment = null; }

        let apiUrl = '/api/' + project + '/';

        if(environment) {
            apiUrl += environment + '/'; 
        }
       
        apiUrl += 'settings';

        if(section) {
            apiUrl += '/' + section;
        }

        return customApiCall('get', apiUrl)

        // Cache settings client-side
        .then((settings) => {
            this.updateCache(project, environment, section, settings);

            return Promise.resolve(settings || {});
        });
    }
   
    /**
     * Cache update
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} section
     */
    static cacheSanityCheck(
        project = requiredParam('project'),
        environment = null,
        section = null
    ) {
        if(environment === '*') { environment = null; }

        this.cache = this.cache || {};
        this.cache[project] = this.cache[project] || {};

        if(environment) {
            this.cache[project][environment] = this.cache[project][environment] || {};

            if(section) {
                this.cache[project][environment][section] = this.cache[project][environment][section] || {};
            }
     
        } else if(section) {
            this.cache[project][section] = this.cache[project][section] || {};
        
        }
    }

    /**
     * Cache update
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} section
     * @param {Object} settings
     */
    static updateCache(
        project = requiredParam('project'),
        environment = null,
        section = null,
        settings = requiredParam('settings')
    ) {
        if(environment === '*') { environment = null; }

        this.cacheSanityCheck(project, environment, section);

        if(environment && !section) {
            return this.cache[project][environment] = settings;
        }

        if(!environment && section) {
            return this.cache[project][section] = settings;
        }
        
        if(environment && section) {
            return this.cache[project][environment][section] = settings;
        } 
        
        return this.cache[project] = settings;
    }

    /**
     * Gets cached settings
     *
     * @param {String} section
     *
     * @returns {Object} Settings
     */
    static getCachedSettings(
        project = requiredParam('project'),
        environment = null,
        section = null,
    ) {
        if(environment === '*') { environment = null; }

        this.cacheSanityCheck(project, environment, section);

        if(environment) {
            if(section) {
                return this.cache[project][environment][section];
            }
                
            return this.cache[project][environment];
        }
        
        if(section) {
            return this.cache[project][section];
        }

        return this.cache[project];
    }

    /**
     * Sets all settings
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} section
     * @param {Object} settings
     *
     * @return {Promise} promise
     */
    static setSettings(
        project = requiredParam('project'),
        environment = null,
        section = null,
        settings = requiredParam('settings')
    ) {
        if(environment === '*') { environment = null; }

        let apiUrl = '/api/' + project + '/';

        settings.usedBy = 'project';

        if(environment) {
            apiUrl += environment + '/'; 

            settings.usedBy = environment;
        }
       
        apiUrl += 'settings';

        if(section) {
            apiUrl += '/' + section;
        }

        return customApiCall('post', apiUrl, settings)

        // Cache new settings
        .then(() => {
            this.updateCache(project, environment, section, settings);

            return Promise.resolve();
        })
    }
}

module.exports = SettingsHelper;
