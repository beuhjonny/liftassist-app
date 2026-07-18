import Toybox.WatchUi;
import Toybox.Graphics;
import Toybox.Communications;
import Toybox.Application.Storage;

class LiftAssistWorkoutView extends WatchUi.View {

    hidden var _mainText = "Loading Session...";

    function initialize() {
        View.initialize();
    }

    function onShow() {
        var token = Storage.getValue("accessToken");
        var url = Constants.URL_GET_SESSION + "?token=" + token;
        
        var options = {
            :method => Communications.HTTP_REQUEST_METHOD_GET,
            :headers => { "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };

        Communications.makeWebRequest(
            url,
            null,
            options,
            method(:onReceiveSession)
        );
    }

    hidden var _sessionData = null;
    hidden var _selectedDayIndex = 0;

    function onReceiveSession(responseCode as $.Toybox.Lang.Number, data as $.Toybox.Lang.Dictionary or $.Toybox.Lang.String or Null) as Void {
        if (responseCode == 200) {
            _sessionData = data as $.Toybox.Lang.Dictionary;
            var days = (_sessionData as $.Toybox.Lang.Dictionary).get("workoutDays");
            
            if (days != null && days instanceof $.Toybox.Lang.Array && (days as $.Toybox.Lang.Array).size() > 0) {
                var daysArr = days as $.Toybox.Lang.Array;
                for (var i = 0; i < daysArr.size(); i++) {
                    var d = daysArr[i] as $.Toybox.Lang.Dictionary;
                    var isRec = d.get("isRecommended") as $.Toybox.Lang.Boolean;
                    if (isRec != null && isRec) {
                        _selectedDayIndex = i;
                        break;
                    }
                }
                WatchUi.requestUpdate();
            } else {
                _mainText = "No workouts found";
            }
            WatchUi.requestUpdate();
        } else {
            _mainText = "Fetch Error: " + responseCode;
            WatchUi.requestUpdate();
        }
    }

    hidden var _animTimer;
    hidden var _animOffset = 0;

    function onHide() {
        if (_animTimer != null) {
            _animTimer.stop();
            _animTimer = null;
        }
    }

    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        
        var w = dc.getWidth();
        var h = dc.getHeight();

        if (_animTimer == null) {
            _animTimer = new Timer.Timer();
            _animTimer.start(method(:onTimer), 100, true);
        }

        if (_sessionData == null) {
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
            dc.drawText(w/2, h/2, Graphics.FONT_TINY, _mainText, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
            return;
        }

        var programName = (_sessionData as $.Toybox.Lang.Dictionary).get("programName") as $.Toybox.Lang.String;
        var days = (_sessionData as $.Toybox.Lang.Dictionary).get("workoutDays") as $.Toybox.Lang.Array;
        var day = days[_selectedDayIndex] as $.Toybox.Lang.Dictionary;
        var dayName = day.get("dayName") as $.Toybox.Lang.String;

        // Header (using premium Ice Blue/Cyan)
        dc.setColor(0x00FFFF, Graphics.COLOR_TRANSPARENT); 
        dc.drawText(w/2, h*0.2, Graphics.FONT_XTINY, programName.toUpper(), Graphics.TEXT_JUSTIFY_CENTER);
        
        // Day Name
        var isRecommended = day.get("isRecommended") as $.Toybox.Lang.Boolean;
        if (isRecommended != null && isRecommended) {
            dc.setColor(0xFF9500, Graphics.COLOR_TRANSPARENT); // Premium Warm Orange
            dc.drawText(w/2, h*0.35, Graphics.FONT_XTINY, "UP NEXT", Graphics.TEXT_JUSTIFY_CENTER);
        } else {
            dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        }

        // Auto-scale font based on day name length
        var font = Graphics.FONT_MEDIUM;
        var dayLen = dayName.length();
        if (dayLen > 18) {
            font = Graphics.FONT_XTINY;
        } else if (dayLen > 14) {
            font = Graphics.FONT_TINY;
        } else if (dayLen > 10) {
            font = Graphics.FONT_SMALL;
        }
        dc.drawText(w/2, h*0.48, font, dayName, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
        
        // Animated Navigation Indicators (Shifted inward from the extreme screen edges)
        if (days.size() > 1) {
            var pulse = (Math.sin(System.getTimer() / 200.0) * 4).toNumber();
            dc.setColor(0x88AABB, Graphics.COLOR_TRANSPARENT); // Premium slate-blue color
            // Up Arrow (Pulsing, shifted from y=10 to y=25)
            dc.fillPolygon([[w/2, 25-pulse], [w/2-8, 33-pulse], [w/2+8, 33-pulse]]);
            // Down Arrow (Pulsing, shifted from y=h-10 to y=h-25)
            dc.fillPolygon([[w/2, h-25+pulse], [w/2-8, h-33+pulse], [w/2+8, h-33+pulse]]);
        }

        // Action prompt
        dc.setColor(0xAAAAAA, Graphics.COLOR_TRANSPARENT); // Slate gray
        dc.drawText(w/2, h*0.75, Graphics.FONT_XTINY, "Press START to begin", Graphics.TEXT_JUSTIFY_CENTER);
    }

    function onTimer() as Void {
        WatchUi.requestUpdate();
    }

    function changeDay(delta as $.Toybox.Lang.Number) as Void {
        if (_sessionData == null) { return; }
        var days = (_sessionData as $.Toybox.Lang.Dictionary).get("workoutDays") as $.Toybox.Lang.Array;
        if (days == null || days.size() == 0) { return; }
        
        _selectedDayIndex += delta;
        if (_selectedDayIndex < 0) {
            _selectedDayIndex = days.size() - 1;
        } else if (_selectedDayIndex >= days.size()) {
            _selectedDayIndex = 0;
        }
        
        WatchUi.requestUpdate();
    }

    function startWorkout() as Void {
        if (_sessionData == null) { return; }
        var dict = _sessionData as $.Toybox.Lang.Dictionary;
        var days = dict.get("workoutDays") as $.Toybox.Lang.Array;
        if (days == null || days.size() == 0) { return; }
        
        var day = days[_selectedDayIndex] as $.Toybox.Lang.Dictionary;
        day.put("programId", dict.get("programId"));
        day.put("programName", dict.get("programName"));
        var view = new LiftAssistExerciseView(day);
        WatchUi.pushView(view, new LiftAssistExerciseDelegate(view), WatchUi.SLIDE_LEFT);
    }
}
