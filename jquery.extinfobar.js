/*
 * ExtInfoBar v1.1 - A jQuery plugin
 * 
 *  Copyright (c) 2012 Andreas Grech
 *
 *  Dual licensed under the MIT and GPL licenses:
 *    http://www.opensource.org/licenses/mit-license.php
 *    http://www.gnu.org/licenses/gpl.html
 *
 * http://dreasgrech.com
 */

(function ($) {
 var HEIGHT = 35,
 IMAGES_FOLDER = 'img/',
 CLOSE = IMAGES_FOLDER + 'close.png',
 CLOSE_HOVER = IMAGES_FOLDER + 'close_hover.png',
 BUTTONBORDER = '1px solid #988f66',
 BUTTONBORDER_HOVER = '1px solid #4c4733',
 BUTTON = '-webkit-linear-gradient(bottom, rgb(204,220,240) 8%, rgb(245,248,252) 92%)',
 BUTTON_CLICK = '-webkit-linear-gradient(top, rgb(204,220,240) 8%, rgb(245,248,252) 92%)',
 errors = {
    notVerified : "Installs can only be initiated by the Chrome Web Store item's verified site"
 },
 isChrome = function () {
    return navigator.userAgent.toLowerCase().indexOf('chrome') >= 0;
 }, getExtensionUrl = function (id) {
     return "https://chrome.google.com/webstore/detail/" + id;
 }, addLink = function (id) {
    $("head").append($("<link/>").attr({'rel' : 'chrome-webstore-item', 'href' : getExtensionUrl(id)}));
 }, detectExtension = function(id, if_installed, if_not_installed) {
        var s = document.createElement('script');
        s.onerror = if_not_installed;
        s.onload = if_installed;
        document.body.appendChild(s);
        s.src = 'chrome-extension://' + id + '/manifest.json';
 }, saveAction = function (action) {
    var actions = {};
    if (localStorage['extInfoBarActions']) {
        actions = JSON.parse(localStorage['extInfoBarActions']);
    }
    if (action == 'install') {
        actions['install'] = new Date();
    } else if (action == 'close') {
        if (!actions['close']) {
            actions['close'] = [];
        }
        actions['close'].push(new Date());
    } else {
        console.log('Wrong action. Only \'close\' and \'install\' actions are allowed.');
    }
    localStorage['extInfoBarActions'] = JSON.stringify(actions);

 }, checkActions = function (opts) {
    var actions = localStorage['extInfoBarActions'];
    if (!actions) return false;
    actions = JSON.parse(actions);
    if (actions.install) return true;
    if (actions.close && actions.close.length) {
        if (actions.close.length >= opts.attempts) {
            return true;
        }
        var now = new Date();
        var last = new Date(actions.close.pop());
        var toWait = opts.daysToWait * 24 * 60 * 60 * 1000;
        if (now - last < toWait) {
            return true;
        } else {
            return false;
        }
    }

 }, animate = function (bar, height, open) {
    bar.animate({
        top: (open ? '+' : '-') + '=' + height
    });
 }, buildInfoBar = function (opts, height) {
     var bar     = $("<div/>").css({'background-image': '-webkit-linear-gradient(bottom, rgb(179,203,231) 0%, rgb(222,234,248) 100%)', 'font-family': 'Tahoma, sans-serif', 'font-size': 14, color: '#333', 'border-bottom': '1.5px solid #b6bac0', height: height, position: 'fixed', left: 0, top: -height + 'px', width: '100%', 'z-index': 2000}),
         icon    = $("<img/>").attr('src', opts.icon).css({padding: '8px 9px 9px 10px', float: 'left'}).attr({width: 20, height: 20}),
         barText = $("<span/>").css({padding: '9px 10px 10px 4px', float: 'left'}).html(opts.message),
         button  = $("<button/>").css({'background-image': BUTTON, '-webkit-border-radius' : '4px', border: BUTTONBORDER, float: opts.buttonFloat, margin: '6px', padding: '3px 8px 3px 9px', color: '#333'}).html('Install'),
         link    = $("<a/>").css({float: 'right', margin: '9px 0 11px 10px', 'text-decoration': 'underline', color: '#364f88', 'font-size': '1em'}).html('Learn more').attr('href', getExtensionUrl(opts.id)).attr('target', '_blank'),
         close   = $("<img/>").attr('src', CLOSE).css({float: 'right', 'padding-right': 9, 'padding-top': 13, 'margin-left' : 10});

     bar.append(icon);
     bar.append(barText);
     bar.append(close);
     bar.append(button);
     if (opts.showLink) {
         bar.append(link);
     }

     close.click(function () {
        animate(bar, height);
        opts.rememberClose && saveAction('close');
     }).hover(function () {
         $(this).attr('src', CLOSE_HOVER);
     },
     function () {
         $(this).attr('src', CLOSE);
     });

     button.click(function () {
        chrome.webstore.install(getExtensionUrl(opts.id), function () {
            animate(bar, height);
            saveAction('install');
        },
        function (error) {
            if (error === errors.notVerified && opts.redirectIfInstallFails) {
                window.open(getExtensionUrl(opts.id));
                opts.rememberRedirect ? saveAction('install') : saveAction('close');
            }
        });
     }).hover(function () {
         $(this).css('border', BUTTONBORDER_HOVER);
     },
     function () {
         $(this).css('border', BUTTONBORDER);
     }).mousedown(function () {
         $(this).css('background-image', BUTTON_CLICK);
     }).mouseup(function () {
         $(this).css('background-image', BUTTON);
     }).mouseout(function () {
         $(this).css('background-image', BUTTON);
     });

     return bar;
 };

 $.fn.extInfobar = function (opts) {

    opts = $.extend({}, $.fn.extInfobar.defaults, opts);
    if (!opts.id) {
        console.log('This plugin will do nothing unless you provide the ID for your extension.');
        return;
    }

    if (!isChrome() || checkActions(opts)) {
        return;
    }

    $(function () {
        detectExtension(
            opts.id,
            function() {
                return false;
            },
            function() {
                var infoBar = buildInfoBar(opts, HEIGHT);

                addLink(opts.id);
                $("body").append(infoBar);
                animate(infoBar, HEIGHT, 1);
            }
        );
    });
 };

 $.fn.extInfobar.defaults = {
    icon: IMAGES_FOLDER + 'defaulticon.png',
    message: 'This website has a Google Chrome extension.  Press Install to get it now.',
    redirectIfInstallFails: true,
    rememberClose: true,
    rememberRedirect: false,
    daysToWait: 7,
    attempts: 3,
    buttonFloat: 'left',
    showLink: true
 };
}(jQuery));

