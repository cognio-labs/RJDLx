/* Google tag bootstrap and opt-in page views, independent of UI animations. */
(function () {
  'use strict';
  if (window.__rjdlxGAInitialized) return;
  window.__rjdlxGAInitialized = true;
  var measurementId = 'G-J4MKWGPQJL';
  var storageKey = 'rjdlx_analytics_consent';
  var saved = null;
  var lastPage = null;
  try { saved = window.localStorage.getItem(storageKey); } catch (error) {}
  window.__rjdlxAnalyticsConsent = saved === 'granted';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  // Set consent before config. Advertising consent is separate from analytics.
  window.gtag('consent', 'default', {
    analytics_storage: window.__rjdlxAnalyticsConsent ? 'granted' : 'denied',
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
  });
  window.gtag('js', new Date());
  var config = { send_page_view: false };
  if (new URLSearchParams(window.location.search).get('ga_debug') === '1') config.debug_mode = true;
  window.gtag('config', measurementId, config);

  window.rjdlxTrackPageView = function () {
    if (!window.__rjdlxAnalyticsConsent) return;
    // Ordinary section anchors are not separate pages. Retain legacy #/ routes.
    var route = window.location.pathname + window.location.search;
    if (/^#\//.test(window.location.hash)) route += window.location.hash;
    if (lastPage === route) return;
    lastPage = route;
    window.gtag('event', 'page_view', {
      send_to: measurementId,
      page_title: document.title,
      page_location: window.location.origin + route
    });
  };

  function ready() {
    var banner = document.getElementById('analyticsConsent');
    if (banner) {
      banner.hidden = saved === 'granted' || saved === 'denied';
      banner.addEventListener('click', function (event) {
        var button = event.target.closest('[data-analytics-consent]');
        if (!button) return;
        var choice = button.getAttribute('data-analytics-consent');
        if (choice !== 'granted' && choice !== 'denied') return;
        try { window.localStorage.setItem(storageKey, choice); } catch (error) {}
        saved = choice;
        banner.hidden = true;
        window.__rjdlxAnalyticsConsent = choice === 'granted';
        window.gtag('consent', 'update', { analytics_storage: choice });
        window.rjdlxTrackPageView();
      });
    }
    // The source router handles legacy redirects before DOMContentLoaded.
    if (document.body.dataset.staticPage === 'true' && /^#\//.test(window.location.hash)) return;
    window.rjdlxTrackPageView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
