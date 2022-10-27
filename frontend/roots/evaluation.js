
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
            const $trow = $("template#errormap-filetable-row-template").tmpl([{ filename: f.name }])
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
    this.on_errormap_accordion_open = function () {
        var $root = $(this)
        var filename = $root.attr('filename')
        var file = GLOBAL.evaluationfiles[filename];
        var $img = $root.find('img.input-image')

        if (GLOBAL.App.ImageLoading.is_image_loaded($img)) {
            GLOBAL.App.ImageLoading.scroll_to_filename(filename)  //won't work the first time
            return;
        }
        $img.on('load', _ => GLOBAL.App.ImageLoading.rescale_image_if_too_large($img[0])) //TODO: also rescale result images
        $img.one('load', () => {
            var $par = $root.find('.set-aspect-ratio-manually')
            var img = $img[0]
            $par.css('--imagewidth', img.naturalWidth)
            $par.css('--imageheight', img.naturalHeight)

            $root.find('.loading-message').remove()
            $root.find('.errormap-filetable-content').show()
            GLOBAL.App.ImageLoading.scroll_to_filename(filename)  //works on the first time
        })
        GLOBAL.App.ImageLoading.set_image_src($img, file);

        //setting the result image as well, only to get the same dimensions
        //if not already loaded from results
        var $result_img = $root.find('img.result-image')
        if ($result_img.length && !GLOBAL.App.ImageLoading.is_image_loaded($result_img))
            GLOBAL.App.ImageLoading.set_image_src($result_img, file);  //TODO: generate new dummy image with same aspect ratio
    }



    // Displays and updates evaluation results.
    this.update_evaluation_results_info = function(NrEvalFiles) {
        $('#evaluation-results-message').removeClass('hidden')

        // Update evaluation data only if there are any evaluation files.
        if (NrEvalFiles > 0) {
            $('#evaluation-results-box').removeClass('hidden')
            $('#evaluation-savefile-box').removeClass('hidden')
            $('thead th#evaluation_errormap_files').text(`${NrEvalFiles} Evaluation Image${(NrEvalFiles == 1) ? '' : 's'} Used`)

            // Placeholder values
            const n1 = 0.06
            const n2 = 0.08
            const n3 = Math.floor((n2 - n1) * 100) / 100

            // Update the html labels.
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

            // Placeholder values
            const m1 = 0.64
            const m2 = 0.56
            const m3 = Math.floor((m2 - m1) * 100) / 100

            // Update the html labels.
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
};