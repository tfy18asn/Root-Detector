
// Evaluation specific operations.
var RootsEvaluation = new function () {

    this.refresh = async function (files) {
        const promise = this.refresh_errormap_filetable(files)
        return Promise.all([promise])
    }

    // Update errormap table
    this.refresh_errormap_filetable = async function (files) {
        var $filetable = $('#evaluation_errormap_table');
        if (!$filetable.is(':visible'))
            console.error('Error map file table is not visible')
        $filetable.find('tbody').html('');

        const insert_single_table_row = async function (i, resolve) {
            const f = files[i]
            if (!f) {
                const $after_inserts = $('after-insert-script')
                const scripts = [...(new Set($after_inserts.get().map(x => x.innerHTML.trim())))]
                scripts.map(eval)

                resolve()
                return;
            }

            const $trow = $("template#filetable-row-template").tmpl([{ filename: f.name }])
            $trow.appendTo($filetable.find('tbody'));
            $trow.first().attr('top', $trow.offset().top)

            //using timeouts to avoid frozen UI
            setTimeout(() => {
                insert_single_table_row(i + 1, resolve);
            }, 0);
        }

        return new Promise((resolve, _reject) => {
            insert_single_table_row(0, resolve)
        });
    }


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
            $root.find('.filetable-content').show()
            GLOBAL.App.ImageLoading.scroll_to_filename(filename)  //works on the first time
        })
        GLOBAL.App.ImageLoading.set_image_src($img, file);

        //setting the result image as well, only to get the same dimensions
        //if not already loaded from results
        var $result_img = $root.find('img.result-image')
        if ($result_img.length && !GLOBAL.App.ImageLoading.is_image_loaded($result_img))
            GLOBAL.App.ImageLoading.set_image_src($result_img, file);  //TODO: generate new dummy image with same aspect ratio
    }

    this.set_image_src = function ($img, file) {
        if ((file instanceof File)
            && (file.type == "image/tiff" || file.name.endsWith('.tif') || file.name.endsWith('.tiff'))) {
            GLOBAL.App.ImageLoading.load_tiff_file(file).then(blob => GLOBAL.App.ImageLoading.set_image_src($img, blob))
        } else if (file instanceof Blob) {
            var url = URL.createObjectURL(file)
            $img.attr('src', url).css('visibility', '')
            $img.one('load', _ => URL.revokeObjectURL(url))
            console.log('Setting image src of', $img, 'to blob', file)
        } else if (is_string(file)) {
            var url = url_for_image(file)
            $img.attr('src', url).css('visibility', '')
            console.log('Setting image src of', $img, 'to string', file)
        } else if (file == undefined) {
            //hidden to prevent the browser showing a placeholder
            $img.css('visibility', 'hidden')
            $img[0].removeAttribute('src')
        } else {
            throw TypeError(`Cannot set image src to ${file}`)
        }
    }
};