sending = false

function _(el) {
  return document.getElementById(el);
}

function progressHandler(event) {
  _("loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
  var percent = (event.loaded / event.total) * 100;
  _("progressBar").value = Math.round(percent);
  _("status").innerHTML = Math.round(percent) + "% uploaded... please wait";
}

function completeHandler(event) {
  // _("status").innerHTML = event.target.responseText;
  _("progressBar").value = 0; //wil clear progress bar after successful upload
}

function errorHandler(event) {
  _("status").innerHTML = "Upload Failed";

}

function abortHandler(event) {
  _("status").innerHTML = "Upload Aborted";
}

const submitUpdateForm =  function(event, form, callback) {
    event.preventDefault();

    if (sending == true) {
        return
    }

    var statusDiv =  $(form).find('.form-operation-status')[0];
    var messageDiv = $(form).find('.operation-result-message')[0];
    var button = $(form).find('input[type="submit"]')[0];
    var url = $(form).attr('action');

    var formData = new FormData(form);
    var progressBar = null;

    $.ajax({
        url : url,
        type : "POST",
        processData: false,
        contentType: false,
        data : formData,
        xhr: function() {

            var xhr = new window.XMLHttpRequest();

            if (progressBar == null) {
                progressBar = $("<div>", {
                    "class": "form-progress-bar-section",
                    "html": '<progress id="progressBar" value="0" max="100"></progress>'
                }).appendTo($(form))

                $("<div>", {
                    "id": "loaded_n_total",
                    "class": "upload-bytes-counter help-text"
                }).appendTo(progressBar);

                $("<div>", {
                    "id": "status",
                    "class": "upload-status"
                }).appendTo(progressBar);
            }

            xhr.upload.addEventListener("progress", progressHandler, false);
            xhr.addEventListener("load", completeHandler, false);
            xhr.addEventListener("error", errorHandler, false);
            xhr.addEventListener("abort", abortHandler, false);

            return xhr;
          },
        success : function(response) {
            messageDiv.style.display = "block";
            messageDiv.innerHTML = response['message'];

            $(form).find("input[type='file']").val('')

            if (typeof(callback) == 'function') {
                callback(response)
            }
        },
        error : function(xhr,errmsg,err) {
            messageDiv.style.display = "block";
            messageDiv.innerHTML = errmsg + " " + xhr.status + ": " + xhr.responseText
        },
        complete: function() {
            sending = false;
            button.disabled = false;
            statusDiv.innerHTML = "";
        }
    });
    sending = true;
    statusDiv.innerHTML = "выполняется";
    messageDiv.innerHTML = ""
    button.disabled = true;
}