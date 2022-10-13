

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
        const files_with_results = Object.values(GLOBAL.trainingfiles).filter( x => !!x.results )
        return files_with_results.map( x => x.name)
    }
    // testa hämta antalet evaluation bilder
    static get_nr_images(){
        console.log($('#nr_evaluation_images'))
        var $nr_ev_files = $('#nr_evaluation_images')
        console.log($nr_ev_files.get(0).value)
        return $nr_ev_files.get(0).value
    }

    // override
    static async on_start_training(){
        //Move evaluation images from trainingfiles
        var NumbEvalFiles = this.get_nr_images();
        for (let i = 0; i<NumbEvalFiles; i++){
            var filenames = Object.keys(GLOBAL.trainingfiles);
            var RandNum = Math.floor(Math.random() *filenames.length);
            GLOBAL.evaluationfiles[filenames[RandNum]] = GLOBAL.trainingfiles[filenames[RandNum]];
            delete GLOBAL.trainingfiles[filenames[RandNum]];
        }   
        console.log(GLOBAL.trainingfiles)
        console.log(GLOBAL.evaluationfiles)

        var filenames = this.get_selected_files()
        console.log('Training on ', filenames)
        
        const progress_cb = (m => this.on_training_progress(m))
        try {
            this.show_modal()
            await this.upload_training_data(filenames)

            $(GLOBAL.event_source).on('training', progress_cb)
            //FIXME: success/fail should not be determined by this request
            await $.post('/training', JSON.stringify({filenames:filenames, options:this.get_training_options()}))
            if(!$('#training-modal .ui.progress').progress('is complete'))
                this.interrupted_modal()
            
            GLOBAL.App.Settings.load_settings()
        } catch (e) {
            console.error(e)
            this.fail_modal()
        } finally {
            $(GLOBAL.event_source).off('training', progress_cb)
        }
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
}

