import numpy as np
import PIL.Image
import zipfile, os, io



def evaluate_single_file(predictionfile:str, annotationfile:str) -> dict:
    ypred = load_segmentationfile(predictionfile)
    ytrue = load_segmentationfile(annotationfile)

    result = {
        'IoU'                : IoU(ytrue, ypred),
        'error_map'          : create_error_map(ytrue, ypred),
        'predictionfile'     : os.path.basename(predictionfile),
        'annotationfile'     : os.path.basename(annotationfile),
    }
    result.update(precision_recall(ytrue, ypred))
    return result

def evaluate_files(basenamepath:list) -> dict:
    IoUavg = 0
    precisionavg = 0
    recallavg = 0
    f1avg = 0
    for f in basenamepath:
        ypred = load_segmentationfile(f'{f}.segmentation.png')
        ytrue = load_segmentationfile(f'{f}.annotation.png')
        IoUavg += IoU(ytrue, ypred)
        em = create_error_map(ytrue, ypred)
        save_error_map_as_png(em,f'{f}.error_map.png' )
        data = precision_recall(ytrue, ypred)
        precisionavg += data['precision']
        recallavg += data['recall']
        f1avg += data['F1']
    N = len(basenamepath)
    print(N)
    IoUavg = IoUavg/N
    precisionavg = precisionavg/N
    recallavg = recallavg/N
    f1avg = f1avg/N

    result = {
        'IoU'                : IoUavg,
        'Precision'          : precisionavg,
        'recall'             : recallavg,
        'F1'                 : f1avg,

    }
    return result
    
def load_segmentationfile(filename:str) -> np.array:
    image = PIL.Image.open(filename).convert('RGB') * np.uint8(1)
    return np.all(image == (255, 255, 255), axis=-1)

def save_evaluation_results(results:list, destination:str):
    csv_text = results_to_csv(results)
    with zipfile.ZipFile(destination, 'w') as archive:
        archive.writestr('statistics.csv', csv_text)
    
        for r in results:
            filename  = r['predictionfile'].replace('.segmentation.png','')
            outpath   = os.path.join(filename, 'error_map.png')
            archive.open(outpath, 'w').write(error_map_to_png(r['error_map']))


def IoU(a:np.array, b:np.array) -> float:
    a = np.asarray(a, bool)
    b = np.asarray(b, bool)
    #single channel inputs required
    assert a.ndim==2 or a.shape[-3]==1
    intersection = a & b
    union        = a | b
    return intersection.sum(-1).sum(-1) / union.sum(-1).sum(-1)

def precision_recall(ytrue:np.array, ypred:np.array) -> dict:
    #FIXME: code-duplication
    ytrue   = np.asarray(ytrue, bool)
    ypred   = np.asarray(ypred, bool)
    TP      = (ypred & ytrue).sum(-1).sum(-1)
    FP      = (ypred & (~ytrue)).sum(-1).sum(-1)
    FN      = ((~ypred) & ytrue).sum(-1).sum(-1)
    precision = TP/(TP+FP)
    recall    = TP/(TP+FN)
    f1        = 2 / (precision**-1 + recall**-1)
    return {
        'TP':TP, 
        'FP':FP, 
        'FN':FN, 
        'precision': precision, 
        'recall':    recall,
        'F1':        f1,
    }



RED   = (1.0, 0.0, 0.0)
GREEN = (0.0, 1.0, 0.0)
BLUE  = (0.0, 0.0, 1.0)

def create_error_map(ytrue:np.array, ypred:np.array) -> np.array:
    #FIXME: code-duplication
    ytrue  = np.asarray(ytrue, bool)
    ypred  = np.asarray(ypred, bool)
    TP     =  ypred &  ytrue
    FP     =  ypred & ~ytrue
    FN     = ~ypred &  ytrue

    result = (
          TP[...,None] * GREEN
        + FP[...,None] * RED
        + FN[...,None] * BLUE
    )
    return result


def results_to_csv(results:list) -> str:
    csv_header = ['#Filename', 'True Positives (px)', 'False Positives (px)', 'False Negatives (px)', 'IoU', 'Precision', 'Recall', 'F1']
    csv_data   = []
    for r in results:
        filename  = r['predictionfile'].replace('.segmentation.png','')
        csv_data += [[
            filename,
            f"{r['TP']:d}",
            f"{r['FP']:d}",
            f"{r['FN']:d}",
            f"{r['IoU']:.2f}",
            f"{r['precision']:.2f}",
            f"{r['recall']:.2f}",
            f"{r['F1']:.2f}",
        ]]
        assert len(csv_data[-1]) == len(csv_header)
    return '\n'.join([', '.join(linedata) for linedata in ([csv_header] + csv_data)])
    
def error_map_to_png(error_map:np.array,path) -> bytes:
    error_map = PIL.Image.fromarray( (error_map*255).astype('uint8') )
    buffer    = io.BytesIO()
    error_map.save(buffer, format='png')
    error_map.save(path)
    buffer.seek(0)
    return buffer.read()
    
def save_error_map_as_png(error_map:np.array,path:str) -> bytes:
    error_map = PIL.Image.fromarray( (error_map*255).astype('uint8') )
    buffer    = io.BytesIO()
    error_map.save(buffer, format='png')
    error_map.save(path)
    return 'yay'

