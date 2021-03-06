'use strict';

/**
 * The sync settings editor
 *
 * @class View SyncEditor
 */
class SyncEditor extends View {
    constructor(params) {
        super(params);

        this.modal = new MessageModal({
            model: {
                class: 'modal-sync-settings settings-modal',
                title: 'Sync'
            },
            buttons: [
                {
                    label: 'Cancel',
                    class: 'btn-default'
                },
                {
                    label: 'Save',
                    class: 'btn-primary',
                    callback: () => {
                        this.onClickSave();

                        return false;
                    }
                }
            ]
        });
        
        this.$element = this.modal.$element;

        SettingsHelper.getSettings(this.projectId, '', 'sync')
        .then((syncSettings) => {
            this.model = syncSettings || {};

            this.fetch();
        });
    }
    
    /**
     * Event: Click save. Posts the model to the modelUrl
     */
    onClickSave() {
        SettingsHelper.setSettings(this.projectId, '', 'sync', this.model)
        .then(() => {
            this.modal.hide();

            this.trigger('change', this.model);
        })
        .catch(UI.errorModal);
    }
    
    /**
     * Render enabled switch
     */
    renderEnabledSwitch() {
        return _.div({class: 'field-editor'},
            UI.inputSwitch(this.model.enabled == true, (newValue) => {
                this.model.enabled = newValue;
            })
        );
    }

    /**
     * Renders the URL editor
     *
     * @returns {HTMLElement} Element
     */
    renderUrlEditor() {
        return _.div({class: 'url-editor'},
            _.input({class: 'form-control', type: 'text', value: this.model.url || '', placeholder: 'e.g. "https://myserver.com/api/"'})
                .on('change', (e) => {
                    this.model.url = $(e.target).val();
                })
        );
    }
    
    /**
     * Renders the project name editor
     *
     * @returns {HTMLElement} Element
     */
    renderProjectNameEditor() {
        if(!this.model.project) {
            this.model.project = this.projectId;
        }

        return _.div({class: 'project-name-editor'},
            _.input({class: 'form-control', type: 'text', value: this.model.project || '', placeholder: 'e.g. "' + ProjectHelper.currentProject + '"'})
                .on('change', (e) => {
                    this.model.project = $(e.target).val();
                })
        );
    }
    
    /**
     * Renders the token editor
     *
     * @returns {HTMLElement} Element
     */
    renderTokenEditor() {
        let view = this;

        function onInputChange() {
            view.model.token = $(this).val();
        }

        function onClickRenew() {
            if(!view.model.url) {
                UI.messageModal('URL missing', 'You need to specify a URL. Please do so and save the settings first.');
                return;
            }
            
            let username = prompt('Remote instance username');
            let password = prompt('Remote instance password');

            apiCall(
                'post',
                view.projectId + '/sync/login',
                {
                    username: username,
                    password: password
                }
            ).then((token) => {
                view.model.token = token;
                $element.children('input').val(token);
            })
            .catch(errorModal);
        }


        let $element;
       
        $element = _.div({class: 'token-editor input-group'},
            _.input({class: 'form-control', type: 'text', value: view.model.token || '', placeholder: 'Input the remote API token here'})
                .on('change', onInputChange),
            _.div({class: 'input-group-btn'},
                _.button({class: 'btn btn-small btn-default'},
                    _.span({class: 'fa fa-refresh'})
                ).on('click', onClickRenew)
            )
        );

        return $element;
    }
    
    /**
     * Renders a single field
     *
     * @param {String} label
     * @param {HTMLElement} content
     *
     * @return {HTMLElement} Editor element
     */
    renderField(label, $content) {
        return _.div({class: 'field'},
            _.div({class: 'field-key'},
                label
            ),
            _.div({class: 'field-value'},
                $content
            )
        );
    }

    render() {
        _.append(this.$element.find('.modal-body').empty(),
            this.renderField('Enabled', this.renderEnabledSwitch()),
            this.renderField('API URL', this.renderUrlEditor()),
            this.renderField('API Token', this.renderTokenEditor()),
            this.renderField('Project', this.renderProjectNameEditor())
        );
    } 
}

module.exports = SyncEditor;
