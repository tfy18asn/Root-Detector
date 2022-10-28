
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
    this.on_errormap_accordion_open = function () {
        var $root = $(this)
        var $img0 = $root.find('img.left.input-image')
        var $img1 = $root.find('img.right.input-image')


        var content_already_loaded = !!$img0.attr('src') && !!$img1.attr('src')
        if (!content_already_loaded) {
            var filename0 = $root.attr('filename0');
            var filename1 = $root.attr('filename1');
            var file0 = GLOBAL.evaluationfiles[filename0];
            var file1 = GLOBAL.evaluationfiles[filename1].results.segmentation;

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
    this.update_evaluation_results_info = function(NrEvalFiles) {
        $('#evaluation-results-message').removeClass('hidden')

        // Update evaluation data only if there are any evaluation files.
        if (NrEvalFiles > 0) {
            $('#evaluation-results-box').removeClass('hidden')
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