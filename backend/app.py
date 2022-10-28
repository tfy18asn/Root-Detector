from base.backend.app import App as BaseApp
from base.backend.app import get_cache_path
from base.backend.app import update_user_settings
import os
import flask

import backend
import backend.training
from . import root_detection
from . import root_tracking

from flask import session

class App(BaseApp):
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        if self.is_reloader:
            return

        self.route('/process_root_tracking', methods=['GET', 'POST'])(self.process_root_tracking)
        self.route('/postprocess_detection/<filename>')(self.postprocess_detection)
        self.route('/evaluation', methods=['GET', 'POST'])(self.evaluation)
        self.route('/discard_model')(self.discard_model)
        
    def postprocess_detection(self, filename):
        #FIXME: code duplication
        full_path = os.path.join(get_cache_path(), filename)
        if not os.path.exists(full_path):
            flask.abort(404)
        
        result = root_detection.postprocess_segmentation_file(full_path)
        result['segmentation'] = os.path.basename(result['segmentation'])
        result['skeleton']     = os.path.basename(result['skeleton'])
        return flask.jsonify(result)
    

    def process_root_tracking(self):
        if flask.request.method=='GET':
            fname0 = os.path.join(get_cache_path(), flask.request.args['filename0'])
            fname1 = os.path.join(get_cache_path(), flask.request.args['filename1'])
            result = root_tracking.process(fname0, fname1, self.get_settings())
        elif flask.request.method=='POST':
            data   = flask.request.get_json(force=True)
            fname0 = os.path.join(get_cache_path(), data['filename0'])
            fname1 = os.path.join(get_cache_path(), data['filename1'])
            result = root_tracking.process(fname0, fname1, self.get_settings(), data)
        
        return flask.jsonify({
            'points0':         result['points0'].tolist(),
            'points1':         result['points1'].tolist(),
            'growthmap'     :  os.path.basename(result['growthmap']),
            'growthmap_rgba':  os.path.basename(result['growthmap_rgba']),
            'segmentation0' :  os.path.basename(result['segmentation0']),
            'segmentation1' :  os.path.basename(result['segmentation1']),
            'success'       :  result['success'],
            'n_matched_points'   : result['n_matched_points'],
            'tracking_model'     : result['tracking_model'],
            'segmentation_model' : result['segmentation_model'],
            'statistics'         : result['statistics'],
        })

    #override    #TODO: unify
    def training(self):
        requestform  = flask.request.get_json(force=True)
        options      = requestform['options']
        if options['training_type'] not in ['detection', 'exclusion_mask']:
            raise NotImplementedError()

        imagefiles   = requestform['filenames']
        imagefiles   = [os.path.join(get_cache_path(), fname) for fname in imagefiles]
        targetfiles  = backend.training.find_targetfiles(imagefiles)
        if not all([os.path.exists(fname) for fname in imagefiles]) or not all(targetfiles):
            flask.abort(404)
        
        backend.training.start_training(imagefiles, targetfiles, options, self.get_settings())
        return 'OK'

    def evaluation(self):
        if flask.request.method=='GET':
            return 'använder vi ej???'
        elif flask.request.method=='POST':
            requestform  = flask.request.get_json(force=True)
            print('yayayayayayayayayayayayayaya')
            print(requestform)
            print('yayayayayayayayayayayayayaya')
            
            ## Temporary code below just for test of evaluation ##
            ## Save one random file that represents error_map.png

            import PIL.Image
            files = requestform['filenames']
            file = files[0]
            basename           = file
            segmentation_fname = f'{basename}.segmentation.png'
            error_map_basename = f'{basename}.error_map.png'
            image = PIL.Image.open(get_cache_path(segmentation_fname))
            image.save(get_cache_path(error_map_basename))

            return flask.jsonify({'results':'ok', 'error_map_path':error_map_basename,'original_image_path': basename })

    def discard_model(self):
        # Retrieve what model type to discard
        modeltype = flask.request.args.get('options[training_type]', 'detection')
        # Retrieve and apply default settings for active models for this modeltype
        defaults = backend.settings.Settings.get_defaults()
        settings = self.get_settings()
        # Current user settings
        s = session['settings']
        s = s['settings']
        # Update settings active models and load model into settings
        s['active_models'][modeltype] = defaults['active_models'][modeltype]
        settings.set_settings(s)
        update_user_settings(settings)
        return 'OK'
