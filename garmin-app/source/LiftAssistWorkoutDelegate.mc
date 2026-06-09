import Toybox.WatchUi;
import Toybox.System;

class LiftAssistWorkoutDelegate extends WatchUi.BehaviorDelegate {

    hidden var _view;

    function initialize(view) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onNextPage() {
        _view.changeDay(1);
        return true;
    }

    function onPreviousPage() {
        _view.changeDay(-1);
        return true;
    }

    function onSelect() {
        _view.startWorkout();
        return true;
    }
}
