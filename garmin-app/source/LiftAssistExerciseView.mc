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

    hidden function drawWrappedExerciseName(dc, name, x, y) {
        var len = name.length();
        var maxChars = 15;
        if (len <= maxChars) {
            dc.setColor(0x00FFFF, Graphics.COLOR_TRANSPARENT);
            dc.drawText(x, y, Graphics.FONT_SMALL, name.toUpper(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            return;
        }

        // Find the space closest to the middle of the string
        var mid = len / 2;
        var bestSpaceIdx = -1;
        var minDiff = 999;
        for (var i = 0; i < len; i++) {
            var char = name.substring(i, i+1);
            if (char.equals(" ")) {
                var diff = i - mid;
                if (diff < 0) { diff = -diff; }
                if (diff < minDiff) {
                    minDiff = diff;
                    bestSpaceIdx = i;
                }
            }
        }

        dc.setColor(0x00FFFF, Graphics.COLOR_TRANSPARENT);
        if (bestSpaceIdx != -1) {
            var line1 = name.substring(0, bestSpaceIdx);
            var line2 = name.substring(bestSpaceIdx + 1, len);
            var font = (line1.length() > maxChars || line2.length() > maxChars) ? Graphics.FONT_XTINY : Graphics.FONT_TINY;
            dc.drawText(x, y - 10, font, line1.toUpper(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            dc.drawText(x, y + 10, font, line2.toUpper(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
        } else {
            // No spaces found, draw on one line in extra tiny font
            dc.drawText(x, y, Graphics.FONT_XTINY, name.toUpper(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
        }
    }

    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        
        var w = dc.getWidth();
        var h = dc.getHeight();

        if (_isUploading) {
            if (_uploadError != null) {
                dc.setColor(0xFF3B30, Graphics.COLOR_TRANSPARENT); // Premium Coral Red
                dc.drawText(w/2, h/2 - 20, Graphics.FONT_MEDIUM, "Upload Failed", Graphics.TEXT_JUSTIFY_CENTER);
                dc.setColor(0xAAAAAA, Graphics.COLOR_TRANSPARENT);
                dc.drawText(w/2, h/2 + 20, Graphics.FONT_XTINY, _uploadError, Graphics.TEXT_JUSTIFY_CENTER);
                dc.drawText(w/2, h - 40, Graphics.FONT_XTINY, "Press BACK to return", Graphics.TEXT_JUSTIFY_CENTER);
            } else {
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
                dc.drawText(w/2, h/2, Graphics.FONT_MEDIUM, _uploadStatus, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            }
            return;
        }

        if (_showConfirmation > 0) {
            var color = (_lastStatus.equals("done")) ? 0x00FF88 : 0xFF3B30; // Mint Green / Coral Red
            var msg = (_lastStatus.equals("done")) ? "SET DONE" : "FAILED";
            
            // Premium centered visual badge
            dc.setColor(color, Graphics.COLOR_TRANSPARENT);
            dc.setPenWidth(4);
            dc.drawCircle(w/2, h/2, 45);
            dc.setPenWidth(1);
            
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h/2, Graphics.FONT_TINY, msg, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Bezel highlight for confirmation
            drawBezelIndicator(dc, color, (_lastStatus.equals("done") ? 35 : 325), 60);
            return;
        }

        if (_isFinished) {
            dc.setColor(0x00FFFF, Graphics.COLOR_TRANSPARENT); // Ice Blue
            dc.drawText(w/2, h*0.35, Graphics.FONT_XTINY, "CONGRATS!", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h*0.52, Graphics.FONT_SMALL, "WORKOUT\nCOMPLETE", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Upload button shifted inward to prevent clipping
            dc.setColor(0x00FF88, Graphics.COLOR_TRANSPARENT); // Mint Green
            dc.drawText(w-35, h*0.3, Graphics.FONT_XTINY, "UPLOAD", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0x00FF88, 35, 30);
            return;
        }

        var ex = (_exercises as $.Toybox.Lang.Array)[_exIndex] as $.Toybox.Lang.Dictionary;

        if (_isResting) {
            // Draw premium resting text
            dc.setColor(0xFF9500, Graphics.COLOR_TRANSPARENT); // Warm gold/orange
            dc.drawText(w/2, h*0.22, Graphics.FONT_TINY, "RESTING", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Centered rest timer
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h*0.48, Graphics.FONT_NUMBER_THAI_HOT, _restRemaining.toString(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Premium circular countdown progress ring
            var radius = w/2 - 12;
            dc.setPenWidth(3);
            dc.setColor(0x333333, Graphics.COLOR_TRANSPARENT); // Dark slate background ring
            dc.drawCircle(w/2, h/2, radius);
            if (_restRemaining > 0) {
                dc.setColor(0xFF9500, Graphics.COLOR_TRANSPARENT);
                var angle = (_restRemaining * 360.0 / 90.0).toNumber();
                dc.drawArc(w/2, h/2, radius, Graphics.ARC_CLOCKWISE, 90, 90 - angle);
            }
            dc.setPenWidth(1);

            // Up Next Preview at the bottom
            dc.setColor(0xAAAAAA, Graphics.COLOR_TRANSPARENT); // Slate gray
            dc.drawText(w/2, h*0.74, Graphics.FONT_XTINY, "UP NEXT", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            if (_setNumber > 1) {
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
                dc.drawText(w/2, h*0.82, Graphics.FONT_XTINY, "SET " + _setNumber, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            } else {
                var nextExName = ex.get("exerciseName") as String;
                var nextWeight = ex.get("prescribedWeight");
                // Wrap exercise name for preview if too long
                var displayNext = nextExName.toUpper();
                if (displayNext.length() > 16) {
                    displayNext = displayNext.substring(0, 14) + "..";
                }
                dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
                dc.drawText(w/2, h*0.82, Graphics.FONT_XTINY, displayNext + " (" + nextWeight.toString() + " lbs)", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            }
            
            // Skip Rest Button (Shifted inward from edge to prevent clipping)
            dc.setColor(0x88AABB, Graphics.COLOR_TRANSPARENT); // Slate blue
            dc.drawText(w-35, h*0.3, Graphics.FONT_XTINY, "SKIP", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0x557788, 35, 25);
        } else {
            var name = ex.get("exerciseName") as $.Toybox.Lang.String;
            var targetSets = ex.get("targetSets") as $.Toybox.Lang.Number;
            var reps = ex.get("prescribedReps") as $.Toybox.Lang.Number;
            var weight = ex.get("prescribedWeight") as $.Toybox.Lang.Number;

            // 1. Exercise Name with Auto-Wrap (Top)
            drawWrappedExerciseName(dc, name, w/2, h*0.18);
            
            // 2. Weight & Reps Stacked Layout (Big/Center - eliminates clipping and overlap)
            dc.setColor(0xE0E0E0, Graphics.COLOR_TRANSPARENT); // Off-white for weight
            dc.drawText(w/2, h*0.44, Graphics.FONT_LARGE, weight.toString() + " lbs", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            dc.setColor(0x00FFFF, Graphics.COLOR_TRANSPARENT); // Cyan for reps
            dc.drawText(w/2, h*0.58, Graphics.FONT_MEDIUM, reps.toString() + " REPS", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);

            // 3. Set Status (Bottom)
            dc.setColor(0xAAAAAA, Graphics.COLOR_TRANSPARENT); // Muted slate gray
            dc.drawText(w/2, h*0.8, Graphics.FONT_TINY, "SET " + _setNumber + " OF " + targetSets, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            
            // Button Indicators (Bezel aligned, shifted inward to prevent screen-edge clipping)
            dc.setColor(0x00FF88, Graphics.COLOR_TRANSPARENT); // Mint Green
            dc.drawText(w-35, h*0.3, Graphics.FONT_XTINY, "DONE", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0x00FF88, 35, 25);
            
            dc.setColor(0xFF3B30, Graphics.COLOR_TRANSPARENT); // Coral Red
            dc.drawText(w-35, h*0.7, Graphics.FONT_XTINY, "FAIL", Graphics.TEXT_JUSTIFY_RIGHT | Graphics.TEXT_JUSTIFY_VCENTER);
            drawBezelIndicator(dc, 0xFF3B30, 325, 25); 
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

    function onSwipe(swipeEvent) {
        var direction = swipeEvent.getDirection();
        if (direction == WatchUi.SWIPE_UP) {
            _view.changeReps(1);
            return true;
        } else if (direction == WatchUi.SWIPE_DOWN) {
            _view.changeReps(-1);
            return true;
        }
        return false;
    }
}
