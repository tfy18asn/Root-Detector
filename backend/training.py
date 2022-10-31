from base.backend import GLOBALS
from base.backend import pubsub
from base.backend.app import get_cache_path
from base.backend.app import update_user_settings
import os, sys
import torch

def training_progress_callback(x):
    pubsub.PubSub.publish({'progress':x,  'description':'Training...'}, event='training')


def start_training(imagefiles, targetfiles, training_options:dict, settings, callback=training_progress_callback):
    locked = GLOBALS.processing_lock.acquire(blocking=False)
    if not locked:
        raise RuntimeError('Cannot start training. Already processing.')

    training_type = training_options['training_type']
    assert training_type in ['detection', 'exclusion_mask']

    device = 'cuda' if settings.use_gpu and torch.cuda.is_available() else 'cpu'
    with GLOBALS.processing_lock:
        GLOBALS.processing_lock.release()  #decrement recursion level bc acquired twice
        model = settings.models[training_type]
        #indicate that the current model is unsaved
        settings.active_models[training_type] = ''
        update_user_settings(settings)
        ok = model.start_training(
            imagefiles, 
            targetfiles, 
            epochs      = int(training_options.get('epochs', 10)),
            lr          = float(training_options.get('lr', 1e-3)),
            num_workers = 'auto' if 'win' not in sys.platform else 0,
            callback    = callback,
            ds_kwargs   = {'tmpdir':get_cache_path()},
            fit_kwargs  = {'device':device},
        )
        model.cpu()
        return 'OK' if ok else 'INTERRUPTED'

def find_targetfiles(inputfiles):
    def find_targetfile(imgf):
        no_ext_imgf = os.path.splitext(imgf)[0]
        for f in [
            f'{imgf}.annotation.png', 
            f'{no_ext_imgf}.annotation.png', 
            f'{no_ext_imgf}.png'
        ]:
            if os.path.exists(f):
                return f
    return list(map(find_targetfile, inputfiles))
