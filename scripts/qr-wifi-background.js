/**
 * @fileOverview Wi-Fi QR code generator background script
 * @name qr-wifi-background.js
 * @author tukapiyo <webmaster@filewo.net>
 * @license Mozilla Public License, version 2.0
 */

browser.runtime.onStartup.addListener(startup);
browser.runtime.onInstalled.addListener(install);
browser.runtime.onMessage.addListener(onmessage);

const qr_option = {
    // render method: 'canvas', 'image' or 'div'
    render: 'image',
    // version range somewhere in 1 .. 40
    minVersion: 1,
    maxVersion: 40,
    // error correction level: 'L', 'M', 'Q' or 'H'
    ecLevel: 'H',
    // offset in pixel if drawn onto existing canvas
    left: 0,
    top: 0,
    // size in pixel
    size: 200,
    // code color or image element
    fill: '#000',
    // background color or image element, null for transparent background
    background: null,
    // content
    text: '',
    // corner radius relative to module width: 0.0 .. 0.5
    radius: 0,
    // quiet zone in modules
    quiet: 0
};


function startup()
{
}

function install()
{
}

browser.contextMenus.create({
    id : 'qr-wifi-generate-psk',
    title : browser.i18n.getMessage('menu_generatePsk'),
    contexts : [
        'selection'
    ]
});
browser.contextMenus.create({
    id : 'qr-wifi-generate-ssid',
    title : browser.i18n.getMessage('menu_generateSsid'),
    contexts : [
        'selection'
    ]
});
browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
    case 'qr-wifi-generate-psk':
        browser.tabs.sendMessage(
            tab.id,
            { action : 'open',
              type   : 'psk',
              data   : info.selectionText }
        );
        break;
    case 'qr-wifi-generate-ssid':
        browser.tabs.sendMessage(
            tab.id,
            { action : 'open',
              type   : 'ssid',
              data   : info.selectionText }
        );
        break;
    }
});
browser.browserAction.onClicked.addListener(function(tab) {
        browser.tabs.sendMessage(
            tab.id,
            { action : 'open',
              type   : 'ssid',
              data   : '' }
        );
});

function onmessage(request, sender, sendResponse)
{
    var option = JSON.parse(JSON.stringify(qr_option));
    option.text = makeQRtext(request.type,
                             request.ssid,
                             request.psk,
                             request.hidden);
    if (option.text) {
        var $div = $('<div></div>');
        $div.qrcode(option);
        sendResponse({ image : $div.children()[0].src });
    }
    else {
        sendResponse({ image : null });
    }
}

function makeQRtext(type, ssid, psk, hidden)
{
    if (   typeof type   != 'string'
        || typeof ssid   != 'string'
        || typeof psk    != 'string'
        || typeof hidden != 'boolean')
        return null;

    var text = 'WIFI:';

    if (type == 'WEP' || type == 'WPA' || type == 'nopass') {
       text += 'T:' + type + ';';
    }
    else return null;

    text += 'S:' + escapeQRtext(ssid) + ';';
    text += 'P:' + escapeQRtext(psk) + ';';

    if (hidden) text += 'H:true;';
    else text += ';';

    return text;
}

function escapeQRtext(text)
{
    return text
        .replace(new RegExp('"','g'), '\\"')
        .replace(new RegExp(';',"g"), '\\;')
        .replace(new RegExp(',',"g"), '\\,')
        .replace(new RegExp(':',"g"), '\\:');
}
