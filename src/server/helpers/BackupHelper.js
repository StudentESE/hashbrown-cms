'use strict';

// Libs
let fs = require('fs');
let glob = require('glob');

/**
 * A helper class for managing backups
 */
class BackupHelper {
    /**
     * Gets a list of backups for a project
     *
     * @param {String} projectName
     *
     * @returns {Array} List of backup names as strings
     */
    static getBackupsForProject(projectName) {
        return new Promise((resolve, reject) => {
            glob(appRoot + '/dump/' + projectName + '/*.hba', (err, files) => {
                if(err) {
                    reject(new Error(err));
                } else {
                    for(let i in files) {
                        files[i] = files[i].replace(appRoot + '/dump/' + projectName + '/', '').replace('.hba', '');
                    }

                    resolve(files);
                }
            });
        });
    }

    /**
     * Creates a backup for a project
     *
     * @param {String} projectName
     */
    static createBackup(projectName) {
        return MongoHelper.dump(projectName);
    }

    /**
     * Gets the file path for a backup
     *
     * @param {String} projectName
     * @param {String} timestamp
     *
     * @returns {Promise} The backup file path
     */
    static getBackupPath(projectName, timestamp) {
        return new Promise((resolve, reject) => {
            let path = appRoot + '/dump/' + projectName + '/' + timestamp + '.hba';

            if(fs.existsSync(path)) {
                resolve(path);
            
            } else {
                reject(new Ereor('Project backup for "' + projectName + '" with timestamp "' + timestamp + '" could not be found'));
            
            }
        });
    }
}

module.exports = BackupHelper;