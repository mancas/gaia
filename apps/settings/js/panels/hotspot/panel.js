/* global openIncompatibleSettingsDialog */

define(function(require) {
  'use strict';

  var SettingsService = require('modules/settings_service');
  var SettingsPanel = require('modules/settings_panel');
  var Hotspot = require('panels/hotspot/hotspot');
  var HotspotSettings =
    require('panels/hotspot_wifi_settings/hotspot_settings');

  return function ctor_hotspot() {
    var elements;
    var hotspotSettings = HotspotSettings();
    var hotspot = Hotspot();

    return SettingsPanel({
      onInit: function(panel) {
        this._settings = navigator.mozSettings;
        this._incompatibleSettingsDialog = 'incompatible-settings-dialog';

        elements = {
          panel: panel,
          hotspotSettingBtn:
            panel.querySelector('#hotspot-settings-section button'),
          hotspotElement:
            panel.querySelector('input#tethering-wifi-enabled'),
          usbTetheringElement:
            panel.querySelector('input#tethering-usb-enabled'),
          hotspotSecurityType: panel.querySelector('#wifi-security-type'),
          hotspotSSID: panel.querySelector('span.hotspotSSID')
        };

        this.hotspotSettingsHandler = this._setHotspotSettingsEnabled;
        this.usbHotspotCheckboxHandler = this._setUSBTetheringCheckbox;
        this.incompatibleSettings = this._openIncompatibleSettingsDialog;
        this.wifiHotspotChangeHandler = this._onWifiHotspotChange;
        this.usbHotspotChangeHandler = this._onUsbHotspotChange;
        this.hotspotSettingsClickHandler = this._onHotspotSettingsClick;

        hotspot.init();
      },

      onBeforeShow: function(panel, options) {
        // Wifi tethering enabled
        hotspot.addEventListener('wifiHotspotChange',
          this.hotspotSettingsHandler);

        // USB tethering enabled
        hotspot.addEventListener('usbHotspotChange',
          this.usbHotspotCheckboxHandler);

        // Incompatible settings
        hotspot.addEventListener('incompatibleSettings',
          this.incompatibleSettings);

        // Wi-fi hotspot event listener
        elements.hotspotElement.addEventListener('change',
          this.wifiHotspotChangeHandler);

        // USB tethering event listener
        elements.usbTetheringElement.addEventListener('change',
          this.usbHotspotChangeHandler);

        elements.hotspotSettingBtn.addEventListener('click',
          this.hotspotSettingsClickHandler);

        hotspotSettings.observe('hotspotSSID', this._updateHotspotSSID);

        // Localize WiFi security type string when setting changes
        hotspotSettings.observe('hotspotSecurity',
          this._updateHotspotSecurity);

        this._updateUI();
      },

      onBeforeHide: function(panel, options) {
        // Wifi tethering
        hotspot.removeEventListener('wifiHotspotChange',
          this.hotspotSettingsHandler);

        // USB tethering
        hotspot.removeEventListener('usbHotspotChange',
          this.usbHotspotCheckboxHandler);

        // Incompatible settings
        hotspot.removeEventListener('incompatibleSettings',
          this.incompatibleSettings);

        // Wi-fi hotspot event listener
        elements.hotspotElement.removeEventListener('change',
          this.wifiHotspotChangeHandler);

        // USB tethering event listener
        elements.usbTetheringElement.removeEventListener('change',
          this.usbHotspotChangeHandler);

        elements.hotspotSettingBtn.removeEventListener('click',
          this.hotspotSettingsClickHandler);

        hotspotSettings.unobserve('hotspotSSID');
        hotspotSettings.unobserve('hotspotSecurity');
      },

      _updateHotspotSecurity: function(newValue) {
        elements.hotspotSecurityType.
          setAttribute('data-l10n-id', 'hotspot-' + newValue);
      },

      _updateHotspotSSID: function(newValue) {
        elements.hotspotSSID.textContent = newValue;
      },

      _setHotspotSettingsEnabled: function(enabled) {
        // disable the setting button when internet sharing is enabled
        elements.hotspotSettingBtn.disabled = enabled;
        elements.hotspotElement.checked = enabled;
      },

      _setUSBTetheringCheckbox: function(enabled) {
        elements.usbTetheringElement.checked = enabled;
      },

      _onWifiHotspotChange: function(event) {
        var checkbox = event.target;
        hotspot.checkIncompatibleSettings(
          hotspot.tetheringUsbKey, checkbox.checked);
      },

      _onUsbHotspotChange: function(event) {
        var checkbox = event.target;
        hotspot.checkIncompatibleSettings(
          hotspot.tetheringWifiKey, checkbox.checked);
      },

      _onHotspotSettingsClick: function() {
        SettingsService.navigate('hotspot-wifiSettings',
          {
            settings: hotspotSettings
          }
        );
      },

      _openIncompatibleSettingsDialog:
        function(newSetting, oldSetting, bothConflicts) {
          // We must check if there is two incompatibilities
          // (usb hotspot case) or just one
          if (bothConflicts) {
            openIncompatibleSettingsDialog(this._incompatibleSettingsDialog,
              hotspot.tetheringUsbKey, hotspot.tetheringWifiKey,
              this._openSecondWarning.bind(this));
          } else {
            openIncompatibleSettingsDialog(this._incompatibleSettingsDialog,
              newSetting, oldSetting, null);
          }
      },

      _openSecondWarning: function() {
        openIncompatibleSettingsDialog(this._incompatibleSettingsDialog,
            hotspot.tetheringUsbKey, hotspot.usbStorageKey,
            null);
      },

      _updateUI: function() {
        this._setHotspotSettingsEnabled(
          hotspot.wifiHotspotSetting
        );
        this._setUSBTetheringCheckbox(
          hotspot.usbHotspotSetting
        );
        this._updateHotspotSSID(hotspotSettings.hotspotSSID);
        this._updateHotspotSecurity(hotspotSettings.hotspotSecurity);
      }
    });
  };
});
