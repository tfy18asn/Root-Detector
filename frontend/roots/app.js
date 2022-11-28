
RootDetectorApp = class extends BaseApp {
    static Detection       = RootDetection;
    static Download        = RootDetectionDownload;
    static ViewControls    = ViewControls;
    static Settings        = RootsSettings;
    static FileInput       = RootsFileInput;
    static Training        = RootsTraining;
}


//override
GLOBAL.App = RootDetectorApp;
App = RootDetectorApp;

// Insert model list in gallery.
App.Training.update_model_list()