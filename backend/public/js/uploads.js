/* eslint-env browser, jquery */
/* Preview + AJAX-upload + прогресс для multer-форм */
(function () {
  function previewImage(input, $target) {
    const f = input.files && input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (e) => $target.attr('src', e.target.result).show();
    r.readAsDataURL(f);
  }

  $(document).on('change', 'input[type=file][data-preview]', function () {
    const sel = $(this).data('preview');
    previewImage(this, $(sel));
  });

  $(document).on('submit', 'form[data-ajax-upload]', function (e) {
    e.preventDefault();
    const $f = $(this);
    const url = $f.attr('action');
    const method = ($f.attr('method') || 'POST').toUpperCase();
    const fd = new FormData(this);
    const $progress = $f.find('.upload-progress');
    $.ajax({
      url, method, data: fd, processData: false, contentType: false,
      xhr: function () {
        const xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener('progress', function (ev) {
          if (ev.lengthComputable && $progress.length) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            $progress.text(pct + '%');
          }
        }, false);
        return xhr;
      },
    })
      .done((data) => { $f.trigger('upload:success', [data]); })
      .fail((xhr) => { $f.trigger('upload:error', [xhr.responseJSON?.message || xhr.statusText]); });
  });
})();
