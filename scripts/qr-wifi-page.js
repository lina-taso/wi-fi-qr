/**
 * @fileOverview Wi-Fi QR code generator in-page script
 * @name qr-wifi-page.js
 * @author tukapiyo <webmaster@filewo.net>
 * @license Mozilla Public License, version 2.0
 */

browser.runtime.onMessage.addListener(qrWifiListener);

const qr_html = `
<style id="qr-wifi-window-style" type="text/css">
#qr-wifi-window {
  all: initial;
  position: fixed;
  z-index: 2147483647;
  box-sizing: border-box;
  left: 50%;
  top: 20%;
  width: 300px;
  max-width: 80%;
  padding: 40px 10px 10px;
  transform: translate(-50%, 0);
  border-radius: 10px;
  box-shadow: 0 0 10px black;
  box-sizing: border-box;
  color: dimgray;
  background-color: white;
}
#qr-wifi-window * {
  margin: 0!important;
  font-size: 14px;
  font-weight: initial;
  line-height: 1.3em;
  font-family: "Hiragino Kaku Gothic ProN","メイリオ", sans-serif;
  box-sizing: border-box;
}
#qr-wifi-window > * {
  margin: 2px 0 4px!important;
}
#qr-wifi-window select {
  -moz-appearance: menulist;
  border: 1px solid gray;
}
#qr-wifi-window input {
  border: 1px solid gray;
}
#qr-wifi-window label {
  display: block;
  width: 100%;
}
#qr-wifi-window-image {
  width: 100%;
  text-align: center;
}
#qr-wifi-window-title {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 30px;
  margin: 0!important;
  padding: 2px 0;
  color: white;
  background-color: gray;
  font-weight: bold;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
#qr-wifi-window-applink {
  border: 1px solid gray;
  background-color: ghostwhite;
  padding: 4px;
}
#qr-wifi-window-close {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  margin: 0!important;
  padding: 0;
  border: 1px solid white;
  background-color: dimgray;
  color: white;
  font-style: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
<div id="qr-wifi-window">
  <div id="qr-wifi-window-image"></div>
  <div id="qr-wifi-window-title">#ui_qrWifiTitle#</div>
  <label>#ui_qrWifiType#
    <select>
      <option value="WPA">WPA/WPA2</option>
      <option value="WEP">WEP</option>
      <option value="nopass">no-pass</option>
    </select>
  </label>
  <label>#ui_qrWifiSsid#
    <input style="width: 100%;">
  </label>
  <label>#ui_qrWifiPsk#
    <input maxlength="63" style="width: 100%;">
  </label>
  <label>
    <input type="checkbox">
    #ui_qrWifiHidden#
  </label>
  <div id="qr-wifi-window-applink">
    <a href="https://play.google.com/store/apps/details?id=com.google.zxing.client.android">QR code reader for android</a>
  </div>
  <div id="qr-wifi-window-close">&#x2716;</div>
</div>
`;

const querySelectorTYPE   = '#qr-wifi-window label:nth-of-type(1) select',
      querySelectorSSID   = '#qr-wifi-window label:nth-of-type(2) input',
      querySelectorPSK    = '#qr-wifi-window label:nth-of-type(3) input',
      querySelectorHIDDEN = '#qr-wifi-window label:nth-of-type(4) input';

function qrWifiListener(message)
{
    switch (message.action) {
    case 'open':
        if (!document.getElementById('qr-wifi-window'))
            document.body.insertAdjacentHTML('beforeend', localization(qr_html));

        // initial value
        switch (message.type) {
        case 'psk':
            document.querySelector(querySelectorPSK).value = message.data;
            break;
        case 'ssid':
            document.querySelector(querySelectorSSID).value = message.data;
            break;
        default:
        }

        // close button event
        document.getElementById('qr-wifi-window-close').addEventListener('click', () => {
            document.body.removeChild(document.getElementById('qr-wifi-window'));
            document.body.removeChild(document.getElementById('qr-wifi-window-style'));
        });
        // change event
        Array.forEach(document.querySelectorAll('#qr-wifi-window select, #qr-wifi-window input'), (item) => {
            item.addEventListener('change', qrWifiGenerateQRcode);
            item.addEventListener('keyup', qrWifiGenerateQRcode);
        });
        break;
    }
}

function qrWifiGenerateQRcode()
{
    var type   = document.querySelector(querySelectorTYPE),
        ssid   = document.querySelector(querySelectorSSID),
        psk    = document.querySelector(querySelectorPSK),
        hidden = document.querySelector(querySelectorHIDDEN);

    if (type.value == 'nopass') {
        psk.value = '';
        psk.disabled = true;
    }
    else {
        psk.disabled = false;
    }

    if (!ssid.value || type.value != 'nopass' && !psk.value) {
        var image = document.getElementById('qr-wifi-window-image');
        image.removeChild(image.firstChild);
        return;
    }

    browser.runtime.sendMessage({
        type   : type.value,
        ssid   : ssid.value,
        psk    : psk.value,
        hidden : hidden.checked
    }).then((response) => {
        var parent  = document.getElementById('qr-wifi-window'),
            replace = document.createElement('div'),
            img     = document.createElement('img');

        img.src = response.image;
        replace.appendChild(img);
        replace.id = 'qr-wifi-window-image';
        parent.replaceChild(replace, parent.querySelector('div:first-child'));
    }).catch((e) => {
        console.log(e);
    });;
}

// localization content ui
function localization(text)
{
    text = text.replace(/\#([_\w]+?)\#/g, (all, group) => {
        return browser.i18n.getMessage(group);
    });
    return text;
}
