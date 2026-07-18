import Toybox.WatchUi;
import Toybox.Graphics;
import Toybox.Communications;
import Toybox.Lang;
import Toybox.Timer;
import Toybox.Application.Storage;

class LiftAssistPairingView extends WatchUi.View {

    hidden var _pairingCode = "Loading...";
    hidden var _status = "Waiting...";
    hidden var _pollTimer;
    hidden var _generated = false;

    function initialize() {
        View.initialize();
        _pollTimer = new Timer.Timer();
    }

    function onLayout(dc) {
    }

    function onShow() {
        if (!_generated) {
            generateCode();
        }
    }
    
    // 1. Generate Code
    function generateCode() {
        _status = "Connecting...";
        WatchUi.requestUpdate();
        
        var options = {
            :method => Communications.HTTP_REQUEST_METHOD_GET,
            :headers => { "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };

        Communications.makeWebRequest(
            Constants.URL_GEN_CODE,
            null,
            options,
            method(:onReceiveCode)
        );
    }

    function onReceiveCode(responseCode as Lang.Number, data as Lang.Dictionary or Lang.String or Null) as Void {
        if (responseCode == 200 && data instanceof Lang.Dictionary) {
            _pairingCode = data.get("code");
            _status = "Link on Web";
            _generated = true;
            WatchUi.requestUpdate();
            
            // Start Polling
            _pollTimer.start(method(:checkStatus), 5000, true);
        } else {
            _pairingCode = "Error";
            _status = "Retry?";
            WatchUi.requestUpdate();
        }
    }

    // 2. Poll Status
    function checkStatus() {
        if (!_generated) { return; }
        
        var url = Constants.URL_CHECK_CODE + "?code=" + _pairingCode;
        var options = {
            :method => Communications.HTTP_REQUEST_METHOD_GET,
            :headers => { "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };

        Communications.makeWebRequest(
            url,
            null,
            options,
            method(:onCheckStatus)
        );
    }

    function onCheckStatus(responseCode as Lang.Number, data as Lang.Dictionary or Lang.String or Null) as Void {
        if (responseCode == 200 && data instanceof Lang.Dictionary) {
            var status = data.get("status");
            if (status != null && status.equals("claimed")) {
                var token = data.get("token");
                if (token != null) {
                    // Success! Save token and switch view
                    Storage.setValue("accessToken", token);
                    _pollTimer.stop();
                    var view = new LiftAssistWorkoutView();
                    WatchUi.switchToView(view, new LiftAssistWorkoutDelegate(view), WatchUi.SLIDE_LEFT);
                }
            }
        }
    }

    function onUpdate(dc) {
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        
        var w = dc.getWidth();
        var h = dc.getHeight();
        
        dc.drawText(w/2, h*0.3, Graphics.FONT_MEDIUM, "Pairing Code:", Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(w/2, h*0.5, Graphics.FONT_LARGE, _pairingCode, Graphics.TEXT_JUSTIFY_CENTER);
        dc.drawText(w/2, h*0.75, Graphics.FONT_SMALL, _status, Graphics.TEXT_JUSTIFY_CENTER);
    }

    function onHide() {
        if (_pollTimer != null) {
            _pollTimer.stop();
        }
    }
}
