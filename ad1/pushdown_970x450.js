/*******************************
 * Weborama Yoki RON Pushdown Takeover
 * 2016-04-25
 ********************************/

screenad.conf_autopreload = false;

// Settings & Global vars
// Alignment vars
var vertical = 'top';
var horizontal = 'center';
var currentURL;

// Size vars
var collapsedHeight = 175;
var expandedHeight = 450;
var currentHeight = collapsedHeight;

// Assets vars
var closeImage = '//media.adrcdn.com/ad-resources/weborama_close_88x88.png';
var openImage = '//media.adrcdn.com/ad-resources/weborama_open_88x88.png';
var videoElement;

var myVideo = document.getElementById('myVideo');

// Sitespecs vars
var initLoadScript = false;
var campaignID;

// This object will be filled with the json return.
var siteObject = new Object();
// Source for the json call.
var jsonSource = '//cntr.adrcntr.com/sitespecs/?site=';
var defaultJson = {'site':{'modified_date':'2016-05-10 11:10:00','website':'.','width':'1200','wrapperid':'NA','headerid':'NA','contentid':'NA','category':'Default','extrajs':'','halign':'center','valign':'banner','zindex':'','offsetx':'0','offsety':'0','closebutton':'1','skins_valign':'top','skins_zindex':'','skins_stickyskyscraperid':'','skins_offsetx':'0','skins_offsety':'0','vpaid':'','vpaid_expand':'','vpaid_playerid':'','vpaid_playerwidth':'640','vpaid_playerheight':'360','vpaid_playeroffsetx':'0','vpaid_playeroffsety':'0','inread_method':'','inread_target':'','inread_number':'0','inread_width':'550','inread_height':'390','inread_insertafter':'0','interscroller_zindex':'','interscroller_extrajs':'','framead_extrajs':'','topad_valign':'top','topad_offset_y':'0','topad_zindex':'','topad_extrajs':''}};

$(document).ready(readyHandler);

function readyHandler() {
    screenad.hide();
    screenad.setSize(900, 450);
    screenad.position();
    doExpanding();

    // Get current location/website
    screenad.executeScript('document.location', getLocation);
}

screenad.onSync = function() {
	screenad.shared.callMethod('setPosition', siteObject);
};

screenad.shared.setPosition = positionHandler;

function positionHandler() {
	screenad.show();
	syncHandler();
}

// Get current page/site specs
function getLocation(loc) {
  jQuery.ajax({
    type: 'GET',
    url: jsonSource + loc,
    dataType: 'json',
    success: function(json) {
      if (json === '0' || json === 0) {
        onSucces(defaultJson);
      }
      onSucces(json);
    },
    error: function(e) {
      // show the ad, center banner
      console.log('Error: can\'t load sitespecs - ' + e);
      onSucces(defaultJson);
    }
  });
}

function onSucces(json) {
    // Retrieve all site properties
    for (var key in json.site) {
        siteObject[key] = json.site[key];
    }
    alignment();
}

// Apply retrieved sitespecs data
function alignment() {
    horizontal = siteObject.halign;
    vertical = siteObject.valign;
    var insertScript;

    if (vertical != 'banner') {
        //Insert 'weborama_pushdown_div' if necessary (not in-page, no billboard ad-slot available)
        var insertLine;
        var body = 'document.getElementsByTagName(\'body\')[0]';
        switch (vertical) {
            case 'top':
                insertLine = body + '.insertBefore(scr_tmpID, ' + body + '.childNodes[0]);';
			break;
            case 'content':
                var content = 'document.getElementById(\'' + siteObject.contentid + '\')';
                insertLine = 'var _wrap = ' + content + '.parentNode; _wrap.insertBefore(scr_tmpID, ' + content + ');';
			break;
            case 'header':
                var header = 'document.getElementById(\'' + siteObject.headerid + '\')';
                insertLine = 'var _wrap = ' + header + '.parentNode; _wrap.insertBefore(scr_tmpID, ' + header + ');';
			break;
            case 'wrapper':
                var wrapper = 'document.getElementById(\'' + siteObject.wrapperid + '\')';
                insertLine = 'var _wrap = ' + wrapper + '.parentNode; _wrap.insertBefore(scr_tmpID, ' + wrapper + ');';
			break;
            default:
                if (vertical.indexOf('#') != -1) {
                    //Align to specified ID (if not using wrapper, header or content id)
                    var cleanID = vertical.replace('#', '');
                    var clean = 'document.getElementById(\'' + cleanID + '\')';
                    insertLine = 'var _wrap = ' + clean + '.parentNode; _wrap.insertBefore(scr_tmpID, ' + clean + ');';
                } else {
                    //On top of website as fallback plan
                    insertLine = body + '.insertBefore(scr_tmpID,' + body + '.childNodes[0]);';
                }
			break;
        }
        // Correct possible entities
        if (siteObject.extrajs !== '' && siteObject.extrajs !== undefined) {
			console.log(siteObject.extrajs);
            if (siteObject.extrajs.indexOf('&lt;') != -1) {
                siteObject.extrajs = siteObject.extrajs.replace(/&lt;/g, '<');
                siteObject.extrajs = siteObject.extrajs.replace(/&gt;/g, '>');
            }
            insertLine += 'try{ ' + siteObject.extrajs + ' }catch(e){}';
        }

        //Insert 'weborama_pushdown_div' script
        insertScript = 	'var divID = \'weborama_pushdown_div\';' +
						'scr_tmpID = document.createElement(\'div\');' +
						'scr_tmpID.style.margin       = \'0px\';' +
						'scr_tmpID.style.padding      = \'0px\';' +
						'scr_tmpID.style.clear        = \'both\';' +
						'scr_tmpID.id                 = divID ;' +
						insertLine;
        screenad.executeScript(insertScript);
        vertical = '#weborama_pushdown_div';
		siteObject.valign = vertical;
    } else {
        if (siteObject.extrajs !== '') {
            insertScript = 'try{ ' + siteObject.extrajs + ' } catch(e) {}';
        }
        screenad.executeScript(insertScript);
    }
    setTimeout(alignPushdown, 200);
}

//[Finally apply Alignment, Stickyness and Z-Index]
function alignPushdown() {
    screenad.setSticky(false);
    if (siteObject.zindex !== undefined && siteObject.zindex.length > 0) {
        screenad.setZIndex(siteObject.zindex);
    }
    screenad.setAlignment(horizontal, vertical);
    screenad.position();
    setPushdownHeight();
	setListeners();
	screenad.setPreloaded(true);
}

// Add Button Listeners
function setListeners() {
    $('#collapseButton').on('click', function() {
        if (currentHeight == expandedHeight) {
            doCollapsing();
        } else if (currentHeight == collapsedHeight) {
            doExpanding();
        }
        var toggleImageSrc = ($('#collapseButton').attr('src') === openImage) ? closeImage : openImage;
        $('#collapseButton').attr('src', toggleImageSrc);
        setPushdownHeight();
    });
}

//Weborama Function that sets the pushdown height
function setPushdownHeight() {
    // call resize
    if (vertical != 'banner') {
        screenad.executeScript('document.getElementById(\'weborama_pushdown_div\').style.height = \'' + currentHeight + 'px\'');
    } else {
        screenad.resize(screenad.bannerwidth, currentHeight, 'banner');
    }
    screenad.position();
}

function doCollapsing() {
    currentHeight = collapsedHeight;
    screenad.setClip(0, 0, 900, 175);
    screenad.event('collapse');
    screenad.position();
    onCollapse();
}

function doExpanding() {
    currentHeight = expandedHeight;
    screenad.setClip(0, 0, 900, 450);
    screenad.event('expand');
    screenad.position();
    onExpand();
}





function createVideo() {
    var settings = {
        width: videoWidth,
        height: videoHeight,
        reference: 'rectangleVideo',
        prependTo: document.getElementById('videoArea'),
        controls: true,
        poster: false,
        loop: true,
        autoplay: true,
        muted: false,
        videoFiles: [{
            src: 'KDK_Intro.mp4', type: 'video/mp4'
        }]
    };

function videoControl() {
    var myVideo = document.getElementById('myVideo');
    if (myVideo.paused) {
        myVideo.play();
    } else {
        myVideo.pause();
    }
}



    var canvasVideo = new screenad.video.VideoPlayer(settings);
    videoElement = canvasVideo.getVideoElement();
}

// External Load Snippet
if (window.XDomainRequest) {jQuery.ajaxTransport(function(s) {if (s.crossDomain && s.async) {if (s.timeout) {s.xdrTimeout = s.timeout;delete s.timeout;}var xdr;return {send: function(_, complete) {function callback(status, statusText, responses, responseHeaders) {xdr.onload = xdr.onerror = xdr.ontimeout = jQuery.noop;xdr = undefined;complete(status, statusText, responses, responseHeaders);}xdr = new XDomainRequest();xdr.onload = function() {callback(200, 'OK', {text: xdr.responseText}, 'Content-Type: ' + xdr.contentType);};xdr.onerror = function() {callback(404, 'Not Found');};xdr.onprogress = jQuery.noop;xdr.ontimeout = function() {callback(0, 'timeout');};xdr.timeout = s.xdrTimeout || Number.MAX_VALUE;xdr.open(s.type, s.url);xdr.send((s.hasContent && s.data) || null);},abort: function() {if (xdr) {xdr.onerror = jQuery.noop;xdr.abort();}}};}});}