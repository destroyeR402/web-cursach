/* eslint-env browser, jquery */
(function () {
  'use strict';

  // === Toast-уведомления ===
  var $container;

  function getContainer() {
    if (!$container || !$container.parent().length) {
      $container = $('<div id="toast-container">').appendTo('body');
    }
    return $container;
  }

  window.toast = function (msg, type) {
    type = type || 'success';
    var $t = $(
      '<div class="toast toast-' + type + '">' +
        '<span class="toast-msg">' + String(msg) + '</span>' +
        '<button class="toast-close" title="Закрыть">×</button>' +
      '</div>'
    );
    $t.find('.toast-close').on('click', function () { dismiss($t); });
    getContainer().append($t);
    setTimeout(function () { dismiss($t); }, 4500);
  };

  function dismiss($t) {
    if ($t.hasClass('toast-hiding')) return;
    $t.addClass('toast-hiding');
    setTimeout(function () { $t.remove(); }, 320);
  }

  // === Хелпер: читаемый текст ошибки из XHR ===
  window.xhrErr = function (xhr) {
    var r = xhr.responseJSON;
    if (!r) return xhr.statusText || 'Неизвестная ошибка';
    if (r.errors && r.errors.length) {
      return r.errors.map(function (e) { return e.message || e.field; }).join(', ');
    }
    if (r.message) return r.message;
    return xhr.statusText || 'Ошибка сервера';
  };

  // === Глобальный перехват 401 — редирект на логин ===
  $(document).on('ajaxError', function (e, xhr) {
    if (xhr.status === 401) {
      window.location = '/auth/login?next=' + encodeURIComponent(window.location.pathname);
    }
  });
})();
