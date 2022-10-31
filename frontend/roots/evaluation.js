
// Evaluation specific operations.
var RootsEvaluation = new function () {

    // Update errormap table
    this.refresh_errormap_filetable = async function (files) {

        // Fetch errormap filetable and clear it.
        var $filetable = $('#evaluation_errormap_table tbody');
        $filetable.find('tr').remove()

        // Function for inserting a single file row.
        const insert_single_table_row = async function (i, resolve) {
            const f = files[i]

            // Needed for row menu functionality like brightness etc.
            if (!f) {
                const $after_inserts = $('after-insert-script')
                const scripts = [...(new Set($after_inserts.get().map(x => x.innerHTML.trim())))]
                scripts.map(eval)

                resolve()
                return;
            }

            // Fetch row template and append to file table.
            const $trow = $("template#errormap-filetable-row-template").tmpl([{ filename0: f.name, filename1: f.name }])
            $trow.appendTo($filetable);
            $trow.first().attr('top', $trow.offset().top)

            // Recursive call
            setTimeout(() => {
                insert_single_table_row(i + 1, resolve);
            }, 0);
        }
        return new Promise((resolve, _reject) => {
            insert_single_table_row(0, resolve)
        });
    }

    // Errormap accordion open.
    this.on_errormap_accordion_open = async function () {
        var $root = $(this)
        var $img0 = $root.find('img.left.input-image')
        var $img1 = $root.find('img.right.input-image')


        var content_already_loaded = !!$img0.attr('src') && !!$img1.attr('src')
        if (!content_already_loaded) {
            var filename0 = $root.attr('filename0');
            var filename1 = $root.attr('filename1');

            var evalfiles = RootsTraining.get_selected_evaluation_files()
            var file0 = await fetch_as_file(url_for_image(filename0))
            var file1 = await fetch_as_file(url_for_image(filename1 + '.error_map.png'))

            //var file0 = GLOBAL.evaluationfiles[filename0];
            //var file1 = GLOBAL.evaluationfiles[filename1].results.segmentation;

            var promise = $img0.one('load', function () {
                $img0.siblings('svg').attr('viewBox', `0 0 ${$img0[0].naturalWidth} ${$img0[0].naturalHeight / 2}`);

            });
            $img1.one('load', async function () {
                $img1.siblings('svg').attr('viewBox', `0 0 ${$img1[0].naturalWidth} ${$img1[0].naturalHeight / 2}`);

                await promise;
                $root.find('.loading-message').remove()
                $root.find('.errormap-filetable-content').show()
            });
            GLOBAL.App.ImageLoading.set_image_src($img0, file0);
            GLOBAL.App.ImageLoading.set_image_src($img1, file1);
        }
    }



    // Displays and updates evaluation results.
    this.update_evaluation_results_info = async function(startingpoint) {
        $('#evaluation-results-message').removeClass('hidden')

        var NrEvalFiles = RootsTraining.get_nr_images()

        // Update evaluation data only if there are any evaluation files.
        if (NrEvalFiles > 0) {
            $('#evaluation-results-box').removeClass('hidden')
            $('thead th#evaluation_errormap_files').text(`${NrEvalFiles} Evaluation Image${(NrEvalFiles == 1) ? '' : 's'} Used`)

            // Refresh errormap filetable
            $('.tabs .item[data-tab="training"]').click()
            RootsEvaluation.refresh_errormap_filetable(Object.values(GLOBAL.evaluationfiles))

            console.log(startingpoint)

            // Fetch evaluation result data.
            /*
            var evalfiles = RootsTraining.get_selected_evaluation_files()
            var results = await $.post('/evaluation',
                JSON.stringify({
                    filenames: evalfiles,
                    startingpoint: startingpoint, options: RootsTraining.get_training_options()
                }))
            */
            var results = 3
            console.log(results)

            /*
            var old_model = results['results_startingpoint']
            var new_model = results['results_current']
            console.log(old_model)
            */

            // Values
            var n1 = 1.0 //old_model['Precision']
            var n2 = 0.5 //new_model['Precision']
            var n3 = Math.floor((n2 - n1) * 100) / 100

            // Update the html labels.
            $('#evaluation-results-accuracy-label-old').text(n1)
            $('#evaluation-results-accuracy-label-new').text(n2)

            if (n3 >= 0.0) {
                $('#evaluation-results-accuracy-label-comp').text("(+" + n3 + ")")
                document.getElementById("evaluation-results-accuracy-label-comp").style.color = "green"
            }

            else {
                $('#evaluation-results-accuracy-label-comp').text("(" + n3 + ")")
                document.getElementById("evaluation-results-accuracy-label-comp").style.color = "red"
            }

            // Values
            n1 = 1.0 //old_model['F1']
            n2 = 0.5 //new_model['F1']
            n3 = Math.floor((n2 - n1) * 100) / 100

            // Update the html labels.
            $('#evaluation-results-f1-label-old').text(n1)
            $('#evaluation-results-f1-label-new').text(n2)

            if (n3 >= 0.0) {
                $('#evaluation-results-f1-label-comp').text("(+" + n3 + ")")
                document.getElementById("evaluation-results-f1-label-comp").style.color = "green"
            }
            else {
                $('#evaluation-results-f1-label-comp').text("(" + n3 + ")")
                document.getElementById("evaluation-results-f1-label-comp").style.color = "red"
            }
        }
    }
};