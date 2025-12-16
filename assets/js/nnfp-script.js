jQuery(function($){

/* ---------- helpers ---------- */
function isValidEmail(email){
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/* send OTP AJAX */
function sendOtpRequest(email, extraData, success, fail){
  $.post(nnfp_data.ajaxurl, $.extend({
    action: 'nnfp_send_otp',
    email: email,
    nonce: nnfp_data.nonce
  }, extraData || {}), function(resp){
    if(resp && resp.success) success(resp); else fail(resp && resp.data ? resp.data : 'Error sending Code');
  }, 'json').fail(function(){ fail('Network error'); });
}

/* verify OTP AJAX */
function verifyOtpRequest(data, success, fail){
  var payload = $.extend({
    action: 'nnfp_verify_otp',
    nonce: nnfp_data.nonce
  }, data);
  $.post(nnfp_data.ajaxurl, payload, function(resp){
    if(resp && resp.success) success(resp); else fail(resp && resp.data ? resp.data : 'Invalid or expired Code');
  }, 'json').fail(function(){ fail('Network error'); });
}

/* build boxes */
function buildOtpBoxesHtml(cls){
  var html = '<div class="nnfp-otp-boxes">';
  for(var i=0;i<6;i++) html += '<input maxlength="1" class="nnfp-otp-box '+(cls||'')+'" />';
  html += '</div>';
  return html;
}

$(document).on('input', '.nnfp-otp-box, .nnfp-otp-boxes', function () {
    // clear status message
    $('#nnfp-modal .nnfp-status').text('');
    $('.nnfp-inline-status').text('');
    $('.nnfp-register-status').text('');
    $('.nnfp-regp-status').text('');
    
    var $this = $(this);
    var val = $this.val();

    // Allow only digits
    val = val.replace(/\D/g, '');
    $this.val(val);

    // Auto move next
    if (val.length === 1) {
        $this.next('.nnfp-otp-box').focus();
    }
});



/* start timer - scoped to a $timer element and $resend btn */
function startTimer(seconds, $timer, $resend){
  if(!$timer || !$timer.length) return;
  // clear previous
  var prev = $timer.data('nnfp_timer_id');
  if(prev) clearInterval(prev);
  var remain = parseInt(seconds,10) || 300;
  if($resend && $resend.length) $resend.hide();
  function tick(){
    var mm = Math.floor(remain/60), ss = remain%60;
    $timer.text('The Code valid for '+mm+':'+(ss<10? '0'+ss:ss));
    remain--;
    if(remain < 0){
      var id = $timer.data('nnfp_timer_id');
      if(id) clearInterval(id);
      $timer.removeData('nnfp_timer_id');
      $timer.text('Your code expired');
      if($resend && $resend.length) $resend.show();
    }
  }
  tick();
  var id = setInterval(tick,1000);
  $timer.data('nnfp_timer_id', id);
}

/* collect ACF fields (simple fields only) */
/* Note: for complex ACF structures (repeaters, flexible content) this is not exhaustive. */
function collectAcfForSubmission($root){
  var acf = {};
  // ACF typically wraps fields in .acf-field with data-key attribute storing field key
  $root.find('.acf-field[data-key]').each(function(){
    var $f = $(this);
    var key = $f.attr('data-key');
    // find the input inside field
    var $input = $f.find('input[type="text"], input[type="email"], input[type="tel"], textarea, select, input[type="number"], input[type="hidden"]').first();
    if($input && $input.length){
      acf[key] = $input.val();
    } else {
      // try fallback for checkbox/radios
      var $cb = $f.find('input[type="checkbox"]:checked, input[type="radio"]:checked').first();
      if($cb && $cb.length) acf[key] = $cb.val();
    }
  });
  return acf;
}

/* clear status on typing for inputs with class pattern */
$(document).on('input', '.nnfp-email, .nnfp-inline-email, .nnfp-register-email', function(){
  var $p = $(this).closest('.nnfp-modal, .nnfp-inline-wrap, #nnfp-page-login');
  if(!$p.length) $p = $('body');
  $p.find('.nnfp-status, .nnfp-inline-status, .nnfp-register-status').text('').css('color','');
});


/* ---------- Modal popup (existing) ---------- */
function openModal(html){
  if(!$('#nnfp-modal').length) $('body').append('<div id="nnfp-modal" class="nnfp-modal"><div class="nnfp-modal-inner"></div></div>');
  $('#nnfp-modal .nnfp-modal-inner').html(html);
  $('#nnfp-modal').fadeIn(150).css('display','flex');
}
function closeModal(){
  var $timer = $('#nnfp-modal').find('.nnfp-timer');
  if($timer.length){
    var id = $timer.data('nnfp_timer_id'); if(id) clearInterval(id); $timer.removeData('nnfp_timer_id');
  }
  $('#nnfp-modal').fadeOut(120);
}

$(document).on('click', '.nnfp-open-login, .nnfp-open-register', function () {

  var html = `
      <div class="nnfp-modal-header">
          <span class="nnfp-badge">Secure Login</span>
          <button class="nnfp-close" aria-label="Close">&times;</button>
      </div>

      <h3 class="nnfp-title">Welcome back 👋</h3>
      <p class="nnfp-subtitle">
          Login or create an account instantly using a one-time password.
      </p>

      <div class="nnfp-field">
          <input 
              type="email" 
              class="nnfp-input nnfp-email" 
              placeholder="Enter your email address"
              autocomplete="email"
          />
      </div>

      <button class="nnfp-btn nnfp-send-otp">
          <span class="nnfp-btn-text">Continue</span>
          <span class="nnfp-loader" hidden></span>
      </button>

      <div class="nnfp-status"></div>
  `;

  openModal(html);
});

$(document).on('click', '.nnfp-send-otp', function () {
  var btn = $(this);
  btn.prop('disabled', true);
  btn.find('.nnfp-btn-text').text('Sending OTP...');
  btn.find('.nnfp-loader').removeAttr('hidden');
});



$(document).on('click', '.nnfp-close', closeModal);

/* popup send OTP */
$(document).on('click', '.nnfp-send-otp', function(){
  var $modal = $('#nnfp-modal');
  var $status = $modal.find('.nnfp-status');
  var email = $modal.find('.nnfp-email').val() || '';
  email = email.trim();
  if(!email){ $status.css('color','#ff3333').text('Please enter your email address'); return; }
  if(!isValidEmail(email)){ $status.css('color','#ff3333').text('Please enter a valid email'); return; }
  $status.css('color','#084e97').text('Submitting...');
  sendOtpRequest(email, { mode: 'login' }, function(resp){
    $modal.data('nnfp_email', email);
    var html = '<div class="nnfp-txt-center"><button class="nnfp-close">&times;</button><h3 class="nnfp-title">Enter Code</h3>' + buildOtpBoxesHtml('') +
               '<div class="nnfp-timer"></div>'+
               '<button class="nnfp-btn nnfp-verify-otp">Verify Code</button> '+
               '<button class="nnfp-btn nnfp-resend-otp" style="display:none;">Resend Code</button>'+
               '<div class="nnfp-footer">'+
                  '<small>We have sent a 6-digit Code to your email, please check and enter here.</small>'+
               '</div>'+
               '<div class="nnfp-status"></div></div>';
    openModal(html);
    var seconds = (resp.data && resp.data.seconds_left) ? resp.data.seconds_left : 300;
    startTimer(seconds, $modal.find('.nnfp-timer'), $modal.find('.nnfp-resend-otp'));
  }, function(err){ $modal.find('.nnfp-status').css('color','#ff3333').text(err); });
});

/* popup verify */
$(document).on('click', '.nnfp-verify-otp', function(){
  $('#nnfp-modal .nnfp-status').css('color','#084e97').text('Verifying...');
  var code=''; $('#nnfp-modal .nnfp-otp-box').each(function(){ code += $(this).val(); });
  verifyOtpRequest({ code: code }, function(){ location.reload(); }, function(err){ $('#nnfp-modal .nnfp-status').css('color','#ff3333').text(err); });
});

/* popup resend */
$(document).on('click', '.nnfp-resend-otp', function(){
  var $modal = $('#nnfp-modal');
  var $status = $modal.find('.nnfp-status');
  var email = $modal.data('nnfp_email') || $modal.find('.nnfp-email').val() || '';
  email = (email||'').trim();
  if(!email){ $status.css('color','#ff3333').text('Email not found. Please re-enter email.'); return; }

  $status.text('Sending new OTP...').css('color','#084e97');
  $.post(nnfp_data.ajaxurl, { action: 'nnfp_resend_otp', email: email, nonce: nnfp_data.nonce }, function(resp){
    if(resp && resp.success){
      $status.text('New OTP sent').css('color','#084e97');
      startTimer((resp.data && resp.data.seconds_left) ? resp.data.seconds_left : 300, $modal.find('.nnfp-timer'), $modal.find('.nnfp-resend-otp'));
      $modal.find('.nnfp-otp-box').val('');
    } else {
      $status.css('color','#ff3333').text(resp && resp.data ? resp.data : 'Could not resend Code');
    }
  }, 'json').fail(function(){ $status.css('color','#ff3333').text('Network error'); });
});

/* -------------------------------------------------
   REGISTRATION POPUP
------------------------------------------------- */

$(document).on('click', '.nnfp-open-register-popup', function () {

    // STEP 1 — Popup HTML with loader and hidden content
    var html = `
        <button class="nnfp-close">&times;</button>

        <div class="nnfp-loader"></div>

        <div class="nnfp-registration-pop-wrap" style="display:none;">
            <h3 class="nnfp-title">Registration</h3>

            <label>Email<span class="nnfp-required-field">*</span></label>
            <input type="email" class="nnfp-input nnfp-regp-email" placeholder="Enter Email" />

            <div class="nnfp-regp-acf-wrap">
                <!-- ACF loads here -->
            </div>

            <button class="nnfp-btn nnfp-regp-send-otp">Submit</button>
            <div class="nnfp-regp-status"></div>
        </div>
    `;

    openModal(html);

    // STEP 2 — Load ACF via AJAX
    $.post(nnfp_data.ajaxurl, {
        action: 'nnfp_get_acf_registration_form',
        nonce: nnfp_data.nonce
    }, function (res) {

        if (res.success) {

            // Insert ACF
            $('#nnfp-modal .nnfp-regp-acf-wrap').html(res.data.html);

            // Initialize ACF JS for dynamic HTML
            if (typeof acf !== 'undefined' && typeof acf.do_action === 'function') {
                acf.do_action('append', $('#nnfp-modal .nnfp-regp-acf-wrap'));
            }

            // Hide loader & show content smoothly
            setTimeout(function () {
                $('#nnfp-modal .nnfp-loader').fadeOut(200, function () {
                    $(this).remove();
                    $('#nnfp-modal .nnfp-registration-pop-wrap').fadeIn(200);
                });
            }, 200); // small delay for smoother transition
        }
    });
});


/* SEND OTP for Registration Popup */
$(document).on('click', '.nnfp-regp-send-otp', function () {

    var $modal = $('#nnfp-modal');
    var $status = $modal.find('.nnfp-regp-status');
    var email = $modal.find('.nnfp-regp-email').val().trim();

    if (!email) return $status.text('Please enter email').css('color', 'red');
    if (!isValidEmail(email)) return $status.text('Invalid email address').css('color', 'red');

    var acfErrors = 0;

    $modal.find('.nnfp-regp-acf-wrap [data-required="1"]').each(function () {

        var $field = $(this);

        // ACF stores value in input, textarea or select
        var val = $field.find('input, textarea, select').val();

        if (!val || val.trim() === "") {
            acfErrors++;
            $field.addClass('acf-error-highlight'); // optional
        } else {
            $field.removeClass('acf-error-highlight');
        }
    });

    if (acfErrors > 0) {
        return $status.text('Please fill all required fields.').css('color', 'red');
    }

    $status.text('Submitting...').css('color', '#084e97');

    //Collect ACF fields BEFORE popup changes
    var acfTemp = collectAcfForSubmission($modal.find('.nnfp-regp-acf-wrap'));
    $modal.data('acf_temp', acfTemp);

    // Send OTP
    sendOtpRequest(email, { mode: 'register' }, function (resp) {

        $modal.data('nnfp_email', email);

        var otpHTML = `
            <div class="nnfp-regp-verify-otp-wrap">
            <button class="nnfp-close">&times;</button>
            <h3 class="nnfp-title">Enter OTP</h3>
            ${buildOtpBoxesHtml('nnfp-regp-otp')}
            <div class="nnfp-regp-timer"></div>
            <button class="nnfp-btn nnfp-regp-verify-otp">Verify Code</button>
            <button class="nnfp-btn nnfp-regp-resend-otp" style="display:none;">Resend Code</button>
            <div class="nnfp-regp-status"></div>
            </div>
        `;

        openModal(otpHTML);

        var sec = resp.data.seconds_left || 60;
        startTimer(sec, $('#nnfp-modal .nnfp-regp-timer'), $('#nnfp-modal .nnfp-regp-resend-otp'));

    }, function (err) {
        $status.text(err).css('color', 'red');
    });
});


/* VERIFY OTP (Registration Popup) */
$(document).on('click', '.nnfp-regp-verify-otp', function () {
    $('#nnfp-modal .nnfp-regp-status').text('Verifying...').css('color','#084e97');
    var code = '';

    $('#nnfp-modal .nnfp-otp-box').each(function () {
        code += $(this).val();
    });

    //Use saved ACF
    var acfData = $('#nnfp-modal').data('acf_temp') || {};

    verifyOtpRequest({
        code: code,
        acf: acfData
    }, function () {
        location.reload();
    }, function (err) {
        $('#nnfp-modal .nnfp-regp-status').text(err).css('color', 'red');
    });
});


/* RESEND OTP (Registration Popup) */
$(document).on('click', '.nnfp-regp-resend-otp', function () {
    var $modal = $('#nnfp-modal');
    var email = $modal.data('nnfp_email');
    var $status = $modal.find('.nnfp-regp-status');
    $status.text('Sending new OTP...').css('color','#084e97');

    if (!email) {
        $status.text('Email missing!').css('color', 'red');
        return;
    }

    $.post(nnfp_data.ajaxurl, {
        action: 'nnfp_resend_otp',
        email: email,
        nonce: nnfp_data.nonce
    }, function (resp) {

        if (resp.success) {
            $status.text('Code resent').css('color', '#084e97');
            startTimer(resp.data.seconds_left || 60,
                $('#nnfp-modal .nnfp-regp-timer'),
                $('#nnfp-modal .nnfp-regp-resend-otp')
            );
        } else {
            $status.text(resp.data).css('color', 'red');
        }

    }, 'json');
});


/* ---------- INLINE LOGIN (#nnfp-page-login) ---------- */
(function(){
  var inlineBox = $("#nnfp-page-login");
  if(!inlineBox.length) return;

  function inlineRenderEmail(){
    inlineBox.html('<div class="nnfp-inline-send-otp-container"><h3 class="nnfp-title">Login</h3>'+
                   '<input type="email" class="nnfp-input nnfp-inline-email" placeholder="Enter Email" />'+
                   '<button class="nnfp-btn nnfp-inline-send-otp">Submit</button>'+
                   '<div class="nnfp-inline-status"></div></div>');
  }
  function inlineRenderOtp(seconds){
    inlineBox.html('<div class="nnfp-txt-center"><h3 class="nnfp-title nnfp-txt-center">Enter Code</h3>'+ buildOtpBoxesHtml('nnfp-inline-otp') +
                   '<div class="nnfp-inline-timer"></div>'+
                   '<button class="nnfp-btn nnfp-inline-verify-otp">Verify Code</button> '+
                   '<button class="nnfp-btn nnfp-inline-resend-otp" style="display:none;">Resend Code</button>'+
                   '<div class="nnfp-inline-status"></div></div>');
    startTimer(seconds, inlineBox.find('.nnfp-inline-timer'), inlineBox.find('.nnfp-inline-resend-otp'));
  }

  inlineRenderEmail();

  $(document).on('click', '.nnfp-inline-send-otp', function(){
    var email = inlineBox.find('.nnfp-inline-email').val() || '';
    email = email.trim();
    var $status = inlineBox.find('.nnfp-inline-status');
    if(!email){ $status.css('color','#ff3333').text('Please enter email'); return; }
    if(!isValidEmail(email)){ $status.css('color','#ff3333').text('Please enter a valid email address'); return; }
    $status.text('Submitting...').css('color','#084e97');

    sendOtpRequest(email, { mode: 'login' }, function(resp){
      inlineBox.data('nnfp_email', email);
      inlineRenderOtp((resp.data && resp.data.seconds_left) ? resp.data.seconds_left : 300);
    }, function(err){
      $status.css('color','#ff3333').text(err);
    });
  });

  $(document).on('click', '.nnfp-inline-verify-otp', function(){
    var code=''; inlineBox.find('.nnfp-inline-otp').each(function(){ code += $(this).val(); });
    var $status = inlineBox.find('.nnfp-inline-status');
    $status.text('Verifying...').css('color','#084e97');
    verifyOtpRequest({ code: code }, function(){ location.reload(); }, function(err){ $status.css('color','#ff3333').text(err); });
  });

  $(document).on('click', '.nnfp-inline-resend-otp', function(){
    var email = inlineBox.data('nnfp_email') || inlineBox.find('.nnfp-inline-email').val() || '';
    var $status = inlineBox.find('.nnfp-inline-status');
    if(!email){ $status.css('color','#ff3333').text('Email not found.'); return; }
    $status.text('Sending new OTP...').css('color','#084e97');

    $.post(nnfp_data.ajaxurl, { action: 'nnfp_resend_otp', email: email, nonce: nnfp_data.nonce }, function(resp){
      if(resp && resp.success){
        $status.text('New OTP sent').css('color','#084e97');
        inlineBox.find('.nnfp-inline-otp').val('');
        startTimer((resp.data && resp.data.seconds_left) ? resp.data.seconds_left : 300, inlineBox.find('.nnfp-inline-timer'), inlineBox.find('.nnfp-inline-resend-otp'));
      } else $status.css('color','#ff3333').text(resp && resp.data ? resp.data : 'Could not resend OTP');
    }, 'json').fail(function(){ $status.css('color','#ff3333').text('Network error'); });
  });

})();



/* ---------- INLINE REGISTRATION (.nnfp-inline-wrap) with ACF collection ---------- */
(function(){
  var regBox = $(".nnfp-inline-wrap");
  if(!regBox.length) return;

  // helper to collect ACF fields values
  function collectAcfData(){
    return collectAcfForSubmission(regBox);
  }

  function regRenderEmail(){
    // preserve ACF HTML (acf_form output) - we assume it's already in DOM inside regBox
    // We'll just ensure email and send button exist (your PHP outputs them already)
    // Nothing to render here because your PHP already printed email input + acf fields + send button.
    // But we clear any status
    regBox.find('.nnfp-register-status').text('');
  }

  function regRenderOtp(seconds){
    regBox.html('<div class="nnfp-register-verify-otp-wrap"><h3 class="nnfp-title">Enter Code</h3>' + buildOtpBoxesHtml('nnfp-register-otp') +
                '<div class="nnfp-register-timer"></div>' +
                '<button class="nnfp-btn nnfp-register-verify-otp">Verify Code</button> ' +
                '<button class="nnfp-btn nnfp-register-resend-otp" style="display:none;">Resend Code</button>' +
                '<div class="nnfp-register-status"></div></div>');
    startTimer(seconds, regBox.find('.nnfp-register-timer'), regBox.find('.nnfp-register-resend-otp'));
  }

  // start
  regRenderEmail();

  // send OTP for registration: collects ACF fields and send to server (mode register)
  $(document).on('click', '.nnfp-send-register-otp', function(){
    var email = regBox.find('.nnfp-register-email').val() || '';
    email = email.trim();
    var $status = regBox.find('.nnfp-register-status');
    if(!email){ $status.text('Please enter email').css('color','#ff3333'); return; }
    if(!isValidEmail(email)){ $status.text('Please enter a valid email address').css('color','#ff3333'); return; }

    var hasErrors = 0;

    $('.nnfp-inline-wrap').find('.acf-field[data-required="1"]').each(function(){

        var $field = $(this);

        // detect value inside the field (works for input/select/textarea)
        var val = $field.find('input, select, textarea').val();

        if(!val || val.trim() === ""){
            hasErrors = true;
            $field.addClass('acf-field-error'); // highlight
        } else {
            $field.removeClass('acf-field-error');
        }
    });

    if(hasErrors > 0){
        return $status.text('Please fill all required fields').css('color','#ff3333');
        
    }

    $status.text('Submitting...').css('color','#084e97');

    var acfData = collectAcfData();

    // send OTP (mode register) — server will create the user if not exists
    sendOtpRequest(email, { mode: 'register', acf: acfData }, function(resp){
      regBox.data('nnfp_email', email);
      regBox.data('nnfp_acf', acfData);
      regRenderOtp((resp.data && resp.data.seconds_left) ? resp.data.seconds_left : 300);
    }, function(err){
      $status.text(err).css('color','#ff3333');
    });
  });

  // verify registration OTP and submit ACF to server
  $(document).on('click', '.nnfp-register-verify-otp', function(){
    var code='';
    regBox.find('.nnfp-register-otp').each(function(){ code += $(this).val(); });
    var $status = regBox.find('.nnfp-register-status');
    $status.text('Verifying...').css('color','#084e97');

    var acfData = regBox.data('nnfp_acf') || collectAcfData();

    verifyOtpRequest({ code: code, mode: 'register', acf: acfData }, function(resp){
      // success
      location.reload();
    }, function(err){
      $status.text(err).css('color','#ff3333');
    });
  });

  // resend registration OTP
  $(document).on('click', '.nnfp-register-resend-otp', function(){
    var email = regBox.data('nnfp_email') || regBox.find('.nnfp-register-email').val() || '';
    var $status = regBox.find('.nnfp-register-status');
    if(!email){ $status.text('Email missing').css('color','#ff3333'); return; }

    $status.text('Sending new OTP...').css('color','#084e97');

    $.post(nnfp_data.ajaxurl, { action: 'nnfp_resend_otp', email: email, nonce: nnfp_data.nonce }, function(resp){
      if(resp && resp.success){
        $status.text('New OTP sent').css('color','#084e97');
        startTimer((resp.data && resp.data.seconds_left) ? resp.data.seconds_left : 300, regBox.find('.nnfp-register-timer'), regBox.find('.nnfp-register-resend-otp'));
        regBox.find('.nnfp-register-otp').val('');
      } else {
        $status.text(resp && resp.data ? resp.data : 'Could not resend OTP').css('color','#ff3333');
      }
    }, 'json').fail(function(){ $status.text('Network error').css('color','#ff3333'); });
  });

})();
});
