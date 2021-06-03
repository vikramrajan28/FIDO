function getPValue(value) {
    return value === 'undefined' || value == null ? '' : value;
}
function openPayment(url) {
    $('#sx').append('<div id="loader" class="loader"></div>')
    // let options = JSON.parse(url);
    // if (getPValue(options.apikey) === '')
    //     {
    //     alert("Payment plugin error: Not initialized.");
    //     return;
    // }
    //
    // if ((options.mode) === '') {
    //     alert("Payment plugin error: Mode cannot be empty. The value should be one of the following values. DefaultPayment = 0, Tokenise = 1, CustomPayment = 3");
    //     return;
    // }

	var iframeid = "payframe";
    var frame = $('<iframe>')
        .css('width', '100%')
        //.css('min-height', '575px')
        .css('border-radius', '25px')
        .attr('allowtransparency', 'true')
		.attr('id',iframeid)
        .attr('frameborder', '2px')
        .attr('scrolling', 'auto')
        .addClass('hide')
        .attr('src', url);//ajax

    $(frame).on('load', function () {
        $('#loader').remove();
    });
    /*
    var modalHeaderTitle = $('<h4>')
        .addClass('modal-title')
        .html('Process Payment');

    var modalHeaderButton = $('<button type="button">')
        .addClass('btn btn-xs pull-right')
        .html('<i class="fa fa-mail-reply"></i> Close & Return')
        .attr('data-dismiss', 'modal')
        .attr('aria-hidden', 'true');

    var modealHeaderDiv = $('<div>')
        .addClass('outerdiv')
        .append('<a class="close" href="javascript:closeFrame();"> <img src="img/close.png" style="width: 4%";></a>')
        .append(frame);

    var modalBodyDiv = $('<div>')
        .addClass('modal-body')
        .css('padding', '0')
        .append(frame)
        .append('<div class="row zp-status"><div class="col-xs-12"><div class="col-xs-offset-3 col-xs-6"><div class="zp-spinner zp-spinner-double-bounce"><div class="zp-double-bounce1"></div><div class="zp-double-bounce2"></div></div> <h4 style="width: 260px; height: auto; position: relative; margin: 10px 10px 10px 10px;">Loading the payment details...</h4></div></div></div>');

    var modalContentDiv = $('<div>')
        .addClass('modal-content')
        .append(modealHeaderDiv)
        .append(modalBodyDiv);

    var modalDialogDiv = $('<div>')
        .addClass('modal-dialog')
        .append(modalContentDiv);

    var modalDiv = $('<div>')
        .addClass('modal')
        .addClass('fade')
        .attr('role', 'dialog')
        .attr('aria-hidden', 'true')
        .attr('data-backdrop', 'static')
        .attr('data-keyboard', 'false')
        .append(modalDialogDiv);*/

    $('#sx').append(frame);
    $('#sx').show();
   /* $(modalDiv).on('hidden.bs.modal', function () {
        $(modalDiv).remove();
        url.options = null;
    });

    $(modalDiv).modal('show');*/
}
function closeFrame() {
    $("#payframe").remove()
    $('#paynow').show();
}