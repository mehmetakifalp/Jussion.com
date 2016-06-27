/**
 * @desc clicked sign_up
 */
function on_sign_up() {
    $('#modal-signin').modal('hide');
    $('#modal-signup').modal('show');
}
/**
 * @desc clicked sign_in
 */
function on_sign_in() {
    $('#modal-signup').modal('hide');
    $('#modal-signin').modal('show');
}

function home_on_sign_up() {
    $('#frm-login').removeClass('visible').addClass('hide');
    $('#frm-forgot-pwd').removeClass('visible').addClass('hide');
    $('#frm-signup').removeClass('hide').addClass('visible');
}

function home_on_sign_in() {
    $('#frm-forgot-pwd').removeClass('visible').addClass('hide');
    $('#frm-signup').removeClass('visible').addClass('hide');
    $('#frm-login').removeClass('hide').addClass('visible');
}

function home_on_forgot_pwd() {
    $('#frm-signup').removeClass('visible').addClass('hide');
    $('#frm-login').removeClass('visible').addClass('hide');
    $('#frm-forgot-pwd').removeClass('hide').addClass('visible');
}

$(function() {

    $('#frm-signup').submit(function() {
        $.post('/signup'
            , {email: $('#frm-signup input[name=email]').val()
               , password: $('#frm-signup input[name=password]').val()
               , birthyear: $('#frm-signup select[name=birthyear]').val()
               , gender: $('#frm-signup input[name=gender]:checked').val()
                , called_room: called_room
                , keyword: $('#select-keyword').val()
            }
            , function(res) {
                if (res == 'success') {
                    location.href = '/';
                }else if (res != 'gocall') {
                    alert(res);
                }else {
                    location.href = '/gocalledroom';
                }
            }
        );

        return false;
    });

    $('#frm-login').submit(function() {
        $.post('/login'
            , {email: $('#frm-login input[name=email]').val(),
                password: $('#frm-login input[name=password]').val(),
                called_room: called_room,
                keyword: $('#select-keyword').val()
            }
            , function(res) {
                if (res == 'success') {
                    location.href = '/';
                }else if (res != 'gocall') {
                    alert(res);
                }else {
                    location.href = '/gocalledroom';
                }
            }
        );

        return false;
    });

    $('#frm-forgot-pwd').submit(function() {
        $('#reset-loading').removeClass('hidden');
        $.post('/forgot-pwd'
            , {forgot_email: $('#forgot_email').val()}
            , function (res) {
                console.log(res);
                $('#reset-loading').addClass('hidden');
                alert(res.message);
            }
        );

        return false;
    });

});
