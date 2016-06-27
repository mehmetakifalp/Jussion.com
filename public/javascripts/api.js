function find_match(keyword) {
    if (!keyword)
        keyword = {};
    $.post('/find-match', keyword)
        .success(function(res){
            if (res.err == 0){
                location.href = '/' + res.roomName;
            }
            else {
                alert(res.message);
                $('#go-form').submit();
            }
        })
        .error(function(err){alert(err)});
}

function report_match(){
    $.post('/report-match', {roomName: roomName})
        .success(function(res){
            if (res.err != 0)
                alert(res.message);
        })
        .error(function(err){alert(err)});
}

function report_leave(){
    $.post('/report-leave', {})
        .success(function(res){
            if (res.err != 0)
                alert(res.message);
        })
        .error(function(err){alert(err)});
}

function go_match(){
    if (email){
        find_match({keyword: $('#select-keyword').val()});
    }
    else {
        on_sign_in();
    }
}