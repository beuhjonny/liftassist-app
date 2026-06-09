import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

class LiftAssistApp extends Application.AppBase {

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state) {
    }

    function onStop(state) {
    }

    function getInitialView() {
        var token = Application.Storage.getValue("accessToken");
        if (token != null) {
             var view = new LiftAssistWorkoutView();
             return [ view, new LiftAssistWorkoutDelegate(view) ];
        } else {
             return [ new LiftAssistPairingView(), new LiftAssistPairingDelegate() ];
        }
    }
}
