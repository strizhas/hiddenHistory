sending = false

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

    $.ajax({
        url : url,
        type : "POST",
        processData: false,
        contentType: false,
        data : formData,

        success : function(response) {
            messageDiv.style.display = "block";
            messageDiv.innerHTML = response['message'];

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