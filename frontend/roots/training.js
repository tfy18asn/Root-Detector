

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
        console.log(GLOBAL.trainingfiles)
        return $nr_ev_files.get(0).value
    }

    // Moves files from training to evaluation
    static add_evaluation_files(NrEvalFiles){
        // Perform as many times as the number of files we want to put aside for evaluation
       for (let i = 0; i<NrEvalFiles; i++){
            // Pick a random training file
            var filenames = Object.keys(GLOBAL.trainingfiles);
            var RandNum = Math.floor(Math.random() *filenames.length);
            // Move this file from training to evaluation
            GLOBAL.evaluationfiles[filenames[RandNum]] = GLOBAL.trainingfiles[filenames[RandNum]];
            delete GLOBAL.trainingfiles[filenames[RandNum]];
        }   
    }

    //static get_nr_training_images()



    // override
    static async on_start_training(){
        //Move evaluation images from trainingfiles
        var NrEvalFiles = this.get_nr_images();
        this.add_evaluation_files(NrEvalFiles);
        console.log(GLOBAL.trainingfiles)
        console.log(GLOBAL.evaluationfiles)

        var filenames = this.get_selected_files()
        console.log('Training on ', filenames)
        
        const progress_cb = (m => this.on_training_progress(m))
        try {
            this.show_modal()

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
        // Set the top limit of evaluation images that can be chosen in the text
        $('#nr_training_images').text(n)
        // Pick out the object where we choose how many evaluation pictures we want
        var $nr_ev_images = $('#nr_evaluation_images').get(0)
        // Set maximum number of evaluation pictures that can be chosen
        $nr_ev_images.max = n
        // 25% of training data or a bit less is the default-value for evaluation
        $nr_ev_images.value = Math.floor(n*0.25)

    }
    
    // Set annotated files as result for an original file
    static async set_results(filename, results){
        var clear = (results == undefined)
    
        if(results && is_string(results.segmentation))
            results.segmentation = await fetch_as_file(url_for_image(results.segmentation))
        var segmentation = clear? undefined : results.segmentation;
    
        GLOBAL.trainingfiles[filename].set_results(results)       
    }
    static get_selected_evaluation_files(){
        const files_with_results = Object.values(GLOBAL.evaluationfiles).filter( x => !!x.results )
        return files_with_results.map( x => x.name)
    }
    static upload_evaluation_data(filenames){
        //TODO: show progress
        var promises      = filenames.map( f => upload_file_to_flask(GLOBAL.trainingfiles[f]) )
        //TODO: refactor
        //TODO: standardize file name
        var segmentations = filenames.map(    f => GLOBAL.evaluationfiles[f].results.segmentation )
                                     .filter( s => s instanceof Blob )
        promises          = promises.concat( segmentations.map( f => upload_file_to_flask(f) ) )
        return Promise.all(promises).catch( this.fail_modal )  //FIXME: dont catch, handle in calling function
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

        const n1 = 0.06
        const n2 = 0.08
        const n3 = Math.floor((n2 - n1) * 100) / 100


        $('#evaluation-results-accuracy-label-old').text(n1)
        $('#evaluation-results-accuracy-label-new').text(n2)

        if (n3 > 0.0) {
            $('#evaluation-results-accuracy-label-comp').text("(+" + n3 + ")")
            document.getElementById("evaluation-results-accuracy-label-comp").style.color = "green"
        }

        else {
            $('#evaluation-results-accuracy-label-comp').text("(" + n3 + ")")
            document.getElementById("evaluation-results-accuracy-label-comp").style.color = "red"
        }
            

        const m1 = 0.64
        const m2 = 0.56
        const m3 = Math.floor((m2 - m1)*100) / 100

        $('#evaluation-results-f2-label-old').text(m1)
        $('#evaluation-results-f2-label-new').text(m2)

        if (m3 > 0.0) {
            $('#evaluation-results-f2-label-comp').text("(+" + m3 + ")")
            document.getElementById("evaluation-results-f2-label-comp").style.color = "green"
        }
        else {
            $('#evaluation-results-f2-label-comp').text("(" + m3 + ")")
            document.getElementById("evaluation-results-f2-label-comp").style.color = "red"
        }
            
        
    }
}



