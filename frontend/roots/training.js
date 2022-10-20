

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

    // Show different text on upload button depending on which model type
    static which_upload_button_to_show(event){
        var model_type = event.target.value
        //var $upload_anno_button = $('#upload_anno_button')
        var $text_ground_truth = $('#ground_truth_button_text')
        var $infotext_anno = $('#text_annotation_files')

        // If detection model is chosen
        if (model_type == 'detection'){
           // $upload_anno_button.toggle(true)
            $text_ground_truth.text('Upload Annotated Training Images')
            $infotext_anno.text('Upload corresponding annotated images to the training images')
        }
        // If exclusion mask model is chosen
        else if (model_type == 'exclusion_mask'){
           // $upload_anno_button.toggle(true)
            $text_ground_truth.text('Upload Exclusion Mask Images')
            $infotext_anno.text('Upload corresponding exclusion mask images to the training images')
        }
    }

    // Show how many evaluation images after you have added ground truth images
    static show_nr_ev_images_section(){
        $('#nr_ev_image_box').toggle(true)
    }





    // override
    static async on_start_training(){
        //Move evaluation images from trainingfiles
        var NrEvalFiles = this.get_nr_images();
        this.add_evaluation_files(NrEvalFiles);
        var options = this.get_training_options();
        var startingpoint = GLOBAL.settings.active_models[options.training_type]
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
            var evalfiles = this.get_selected_evaluation_files()
            var results = await $.post('/evaluation', JSON.stringify({filenames:evalfiles, startingpoint:startingpoint}))
            console.log(results)
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
        const files_with_results = Object.values(GLOBAL.evaluationfiles) //.filter( x => !!x.results )
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
}



