

RootsTraining = class extends BaseTraining {

    //override
    static refresh_tab(){
        super.refresh_tab()
        this.update_number_of_training_files_info()
    }
    
    //dummy override: all files selected  //TODO: move upstream
    // filtrerar bort de filer som är uppladdade men inte är processed? byt till GLOBAL.trainingfiles
    // ta bort filtreringen
    static get_selected_files(){
        const files_with_results = Object.values(GLOBAL.files).filter( x => !!x.results )
        return files_with_results.map( x => x.name)
    }

    //override
    static get_training_options(){
        const training_type = $('#training-model-type').dropdown('get value');
        return {
            training_type       : training_type,
            learning_rate       : Number($('#training-learning-rate')[0].value),
            epochs              : Number($('#training-number-of-epochs')[0].value),
        };
    }

    //override
    static update_model_info(){
        const model_type  = $('#training-model-type').dropdown('get value');
        if(!model_type)
            return;
        
        super.update_model_info(model_type)
    }

    static update_number_of_training_files_info(){
        const n = this.get_selected_files().length;
        $('#training-number-of-files-info-label').text(n)
        $('#training-number-of-files-info-message').removeClass('hidden')
    }

    //override
    static success_modal() {
        $('#training-modal .progress').progress('set success', 'Training finished');
        $('#training-modal #ok-training-button').show()
        $('#training-modal #cancel-training-button').hide()

        // Update evaluation.
        this.update_evaluation_results_info()
    }

    // Displays and updates evaluation results.
    static update_evaluation_results_info() {
        $('#evaluation-results-message').removeClass('hidden')

        const n = 0.06;
        $('#evaluation-results-accuracy-label').text(n)
        
    }
}

