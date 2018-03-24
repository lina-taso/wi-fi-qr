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
  position: fixed;
  z-index: 2147483647;
  box-sizing: border-box;
  width: 300px;
  max-width: 80%;
  left: 50%;
  top: 20%;
  transform: translate(-50%, 0);
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 0 10px black;
  background: white;
  color: dimgray;
}
#qr-wifi-window * {
  margin: initial;
  padding: initial;
  font: initial;
  font-size: 14px;
  line-height: 1.2em;
  text-align: left;
}
#qr-wifi-window > * {
  margin: 2px 0 4px;
}
#qr-wifi-window select, #qr-wifi-window input {
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
  background-color: dimgray;
  color: white;
  font-weight: bold;
  text-align: center;
  margin: 2px 0;
  padding: 2px;
}
#qr-wifi-window-applink {
  border: 1px solid gray;
  background-color: ghostwhite;
  padding: 4px;
}
#qr-wifi-window-close {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: dimgray;
  border: 1px solid white;
  color: white;
  font-style: bold;
  line-height: initial;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
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
