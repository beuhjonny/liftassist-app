import Toybox.WatchUi;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.Timer;
import Toybox.Application.Storage;
import Toybox.Communications;
import Toybox.Attention;

class LiftAssistExerciseView extends WatchUi.View {

    hidden var _day;
    hidden var _exercises;
    hidden var _exIndex = 0;
    hidden var _setNumber = 1;
    hidden var _workoutLog = [];
    
    hidden var _startTime;
    hidden var _isResting = false;
    hidden var _isUploading = false;
    hidden var _isFinished = false;
    hidden var _uploadStatus = "Uploading...";
    hidden var _uploadError = null;
    hidden var _restRemaining = 0;
    hidden var _lastStatus = "done";
    hidden var _restTimer;
    hidden var _successTimer;
    hidden var _showConfirmation = 0; // Countdown for "Set Logged" msg
    hidden var _confirmationTimer;

    function initialize(day) {
        View.initialize();
        _day = day;
        _exercises = day.get("exercises");
        _startTime = System.getClockTime(); // Simple start time
    }

    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        
        var w = dc.getWidth();
        var h = dc.getHeight();

        if (_isUploading) {
            if (_uploadError != null) {
                dc.setColor(Graphics.COLOR_RED, Graphics.COLOR_TRANSPARENT);
                dc.drawText(w/2, h/2 - 20, Graphics.FONT_MEDIUM, "Upload Failed", Graphics.TEXT_JUSTIFY_CENTER);
                dc.drawText(w/2, h/2 + 20, Graphics.FONT_XTINY, _uploadError, Graphics.TEXT_JUSTIFY_CENTER);
                dc.drawText(w/2, h - 40, Graphics.FONT_XTINY, "Press BACK to return", Graphics.TEXT_JUSTIFY_CENTER);
            } else {
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
                dc.drawText(w/2, h/2, Graphics.FONT_MEDIUM, _uploadStatus, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            }
            return;
        }

        if (_showConfirmation > 0) {
            var color = (_lastStatus.equals("done")) ? Graphics.COLOR_GREEN : Graphics.COLOR_RED;
            var msg = (_lastStatus.equals("done")) ? "SET DONE" : "SET FAILED";
            
            dc.setColor(color, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h/2, Graphics.FONT_MEDIUM, msg, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Slick bezel highlight for confirmation
            drawBezelIndicator(dc, color, (_lastStatus.equals("done") ? 35 : 325), 45);
            return;
        }

        if (_isFinished) {
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h*0.55, Graphics.FONT_SMALL, "WORKOUT\nCOMPLETE", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            dc.setColor(0x00FF00, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w-25, h*0.3, Graphics.FONT_XTINY, "UPLOAD ", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0x00FF00, 35, 30);
            return;
        }

        var ex = (_exercises as $.Toybox.Lang.Array)[_exIndex] as $.Toybox.Lang.Dictionary;

        if (_isResting) {
            dc.setColor(0xFFAA00, Graphics.COLOR_TRANSPARENT); 
            dc.drawText(w/2, h*0.25, Graphics.FONT_SMALL, "RESTING", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h*0.48, Graphics.FONT_NUMBER_THAI_HOT, _restRemaining.toString(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
            
            if (_setNumber > 1) {
                // Pointing to the set we are about to do
                dc.drawText(w/2, h*0.72, Graphics.FONT_XTINY, "UP NEXT: SET " + _setNumber, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            } else {
                // We just finished an exercise, pointing to the first set of the next one
                var name = ex.get("exerciseName") as String;
                var weight = ex.get("prescribedWeight");
                dc.drawText(w/2, h*0.72, Graphics.FONT_XTINY, "UP NEXT:", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
                dc.drawText(w/2, h*0.82, Graphics.FONT_XTINY, name.toUpper() + " (" + weight.toString() + ")", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            }
            
            // Skip Rest Button
            dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w-25, h*0.3, Graphics.FONT_XTINY, "SKIP ", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, Graphics.COLOR_DK_GRAY, 35, 25);
        } else {
            var name = ex.get("exerciseName") as $.Toybox.Lang.String;
            var targetSets = ex.get("targetSets") as $.Toybox.Lang.Number;
            var reps = ex.get("prescribedReps") as $.Toybox.Lang.Number;
            var weight = ex.get("prescribedWeight") as $.Toybox.Lang.Number;

            // 1. Exercise Name (Top)
            dc.setColor(0x00AAFF, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h*0.18, Graphics.FONT_SMALL, name.toUpper(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // 2. Weight x Reps (Big/Center)
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2 - 25, h*0.5, Graphics.FONT_NUMBER_HOT, weight.toString(), Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            dc.drawText(w/2 + 25, h*0.5, Graphics.FONT_NUMBER_HOT, reps.toString(), Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Draw custom X (broken character fix) - cleaner version
            dc.setColor(0x00AAFF, Graphics.COLOR_TRANSPARENT);
            dc.setPenWidth(3);
            dc.drawLine(w/2-8, h*0.5-8, w/2+8, h*0.5+8);
            dc.drawLine(w/2+8, h*0.5-8, w/2-8, h*0.5+8);
            dc.setPenWidth(1);

            // 3. Set Status (Bottom)
            dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h*0.8, Graphics.FONT_TINY, "SET " + _setNumber + " OF " + targetSets, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Button Indicators (Bezel aligned)
            dc.setColor(0x00FF00, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w-25, h*0.3, Graphics.FONT_XTINY, "DONE ", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0x00FF00, 35, 25);
            
            dc.setColor(0xFF0000, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w-25, h*0.7, Graphics.FONT_XTINY, "FAIL ", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0xFF0000, 325, 25); 
        }
    }

    function drawBezelIndicator(dc, color, angleCenter, length) {
        dc.setColor(color, Graphics.COLOR_TRANSPARENT);
        dc.setPenWidth(6);
        var r = dc.getWidth() / 2 - 4;
        dc.drawArc(dc.getWidth()/2, dc.getHeight()/2, r, Graphics.ARC_CLOCKWISE, angleCenter + length/2, angleCenter - length/2);
        dc.setPenWidth(1);
    }

    function changeReps(delta as $.Toybox.Lang.Number) as Void {
        if (_isResting || _isUploading) { return; }
        var ex = (_exercises as $.Toybox.Lang.Array)[_exIndex] as $.Toybox.Lang.Dictionary;
        var reps = ex.get("prescribedReps") as $.Toybox.Lang.Number;
        reps += delta;
        if (reps < 0) { reps = 0; }
        ex.put("prescribedReps", reps);
        WatchUi.requestUpdate();
    }

    function logSet(status) as Void {
        if (_isFinished) {
            finishWorkout();
            return;
        }
        if (_isResting) {
            stopRest();
            return;
        }

        var ex = (_exercises as $.Toybox.Lang.Array)[_exIndex] as $.Toybox.Lang.Dictionary;
        var targetSets = ex.get("targetSets") as $.Toybox.Lang.Number;

        _lastStatus = status;
        
        // Record the set
        var loggedSet = {
            "exerciseId" => ex.get("id"),
            "exerciseName" => ex.get("exerciseName"),
            "setNumber" => _setNumber,
            "actualWeight" => ex.get("prescribedWeight"),
            "actualReps" => ex.get("prescribedReps"),
            "status" => status,
            "timestamp" => System.getClockTime().hour.toString() + ":" + System.getClockTime().min.toString()
        };
        (_workoutLog as $.Toybox.Lang.Array).add(loggedSet);

        _showConfirmation = 2; // Show for 2 seconds
        _confirmationTimer = new Timer.Timer();
        _confirmationTimer.start(method(:onConfirmationTimer), 1000, true);

        if (_setNumber < targetSets) {
            _setNumber++;
            startRest();
        } else {
            if (_exIndex < (_exercises as $.Toybox.Lang.Array).size() - 1) {
                _exIndex++;
                _setNumber = 1;
                startRest();
            } else {
                _isFinished = true;
                if (Attention has :vibrate) {
                    Attention.vibrate([new Attention.VibeProfile(100, 500)]);
                }
            }
        }
        WatchUi.requestUpdate();
    }

    function onConfirmationTimer() as Void {
        if (_showConfirmation > 0) {
            _showConfirmation--;
            if (_showConfirmation == 0) {
                _confirmationTimer.stop();
                _confirmationTimer = null;
            }
            WatchUi.requestUpdate();
        }
    }

    function startRest() {
        _isResting = true;
        _restRemaining = 90; // Default 90s
        _restTimer = new Timer.Timer();
        _restTimer.start(method(:onRestTimer), 1000, true);
    }

    function stopRest() {
        _isResting = false;
        if (_restTimer != null) {
            _restTimer.stop();
            _restTimer = null;
        }
        WatchUi.requestUpdate();
    }

    function onRestTimer() as Void {
        if (_restRemaining > 0) {
            _restRemaining--;
            WatchUi.requestUpdate();
        } else {
            if (Attention has :vibrate) {
                Attention.vibrate([
                    new Attention.VibeProfile(100, 200),
                    new Attention.VibeProfile(0, 100),
                    new Attention.VibeProfile(100, 200)
                ]);
            }
            stopRest();
        }
    }

    function finishWorkout() {
        var token = Storage.getValue("accessToken");
        var url = Constants.URL_SUBMIT_SESSION;
        
        // 1. Group sets by exercise
        var performedExercises = [];
        var currentEx = null;
        
        var workoutLogArr = _workoutLog as $.Toybox.Lang.Array;
        System.println("Finishing Workout. Log size: " + workoutLogArr.size());
        
        for (var i = 0; i < workoutLogArr.size(); i++) {
            var set = workoutLogArr[i] as $.Toybox.Lang.Dictionary;
            var exId = set.get("exerciseId");
            
            if (currentEx == null || (currentEx as $.Toybox.Lang.Dictionary).get("exerciseId") != exId) {
                currentEx = {
                    "exerciseId" => exId,
                    "exerciseName" => set.get("exerciseName"),
                    "sets" => []
                };
                performedExercises.add(currentEx);
            }
            
            var setsArr = (currentEx as $.Toybox.Lang.Dictionary).get("sets") as $.Toybox.Lang.Array;
            setsArr.add(set);
        }

        // 2. Build full package
        var workoutPackage = {
            "programId" => _day.get("programId") as $.Toybox.Lang.String,
            "dayId" => _day.get("id") as $.Toybox.Lang.String,
            "dayName" => _day.get("dayName") as $.Toybox.Lang.String,
            "performedExercises" => performedExercises,
            "startTime" => null, 
            "endTime" => null
        };

        System.println("Prepared Package: " + workoutPackage.toString());

        var options = {
            :method => Communications.HTTP_REQUEST_METHOD_POST,
            :headers => { "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };

        var body = {
            "token" => token,
            "workout" => workoutPackage
        };

        System.println("Making Web Request to: " + url);
        Communications.makeWebRequest(url, body, options, method(:onUploadComplete));
        
        _isUploading = true;
        _uploadStatus = "Uploading...";
        _uploadError = null;
        WatchUi.requestUpdate();
    }

    function onUploadComplete(responseCode as Number, data as Dictionary or String or Null) as Void {
        System.println("Upload Response: " + responseCode);
        if (data != null) {
            System.println("Response Data: " + data.toString());
        }

        if (responseCode == 200) {
            _uploadStatus = "Success!";
            WatchUi.requestUpdate();
            
            // Persist the timer in class variable so it isn't garbage collected
            _successTimer = new Timer.Timer();
            _successTimer.start(method(:popAfterSuccess), 1000, false);
        } else {
            _uploadError = "Error: " + responseCode;
            WatchUi.requestUpdate();
        }
    }

    function popAfterSuccess() as Void {
        _successTimer.stop();
        _successTimer = null;
        WatchUi.popView(WatchUi.SLIDE_RIGHT);
    }
}

class LiftAssistExerciseDelegate extends WatchUi.BehaviorDelegate {
    hidden var _view;

    function initialize(view) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onSelect() {
        _view.logSet("done");
        return true;
    }

    function onBack() {
        _view.logSet("failed");
        return true;
    }

    function onNextPage() {
        _view.changeReps(-1);
        return true;
    }

    function onPreviousPage() {
        _view.changeReps(1);
        return true;
    }
}
