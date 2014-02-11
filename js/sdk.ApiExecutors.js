define(function (require) {
  var $ = require('jquery');
  var urljoin = require('url-join');

  return function (client, settings) {
    var executors = this;

    this['accesstoken'] = function (skipchangeTokenme) {
      var url = urljoin(client.namespace, '/oauth/token');
      return $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          client_id:     client.clientID,
          client_secret: client.clientSecret,
          grant_type:    'client_credentials'
        })
      }).pipe(function (token) {
        if(!skipchangeTokenme) {
          $('.tokenme').html(token.access_token);
        }
        return token;
  });
    };

    /**
     * return a token promise, this will either fetch a token
     * or use one already fetched.
     * @return {[type]} [description]
     */
    function getToken() {
      var tknpromise;

      if ($('.tokenme').html() !== '{token}') {
        tknpromise = $.when({access_token: $('.tokenme').html()});
      } else {
        tknpromise = executors['accesstoken'](true);
      }

      return tknpromise;
    }

    this['allusers'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace, '/api/users?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['allconnections'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace, '/api/connections?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['oneconnection'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/connections/',
                          $('#connection-get-selector option:selected').val(),
                          '?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['socialconn-users'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace, '/api/socialconnections/users?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['connection-users'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/connections/',
                          $('#connection-users-selector option:selected').val(),
                          '/users?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['clientusers'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/clients/',
                          client.clientID,
                          '/users?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['connectiondelete'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/connections/',
                          $('#connection-delete-selector option:selected').val(),
                          '?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'DELETE'});
      });
    };

    this['connectioncreate'] = function () {
      var strategy = $('#api-create-connection-strategy-selector option:selected').val();
      var connection = {
        name: $('#api-create-connection-name').val(),
        strategy: strategy,
        options: {}
      };

      $('input, textarea', '#create-connection-options-' + strategy).each(function () {
        connection.options[$(this).attr('data-field')] =
          $(this).val();
      });

      $('#create-connection-options-' + strategy + ' button').each(function () {
        connection.options[$(this).attr('data-field')] =
          $(this).hasClass('active');
      });

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/connections',
                          '?access_token=' + token.access_token);
        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(connection)
        });

      });
    };

    this['websitelogin'] = function () {

      var connection = $('#connection-weblogin-selector option:selected').val();

      var url = urljoin(client.namespace,
                        '/authorize',
                        '?response_type=code&client_id=' + client.clientID +
                        '&redirect_uri='  + client.callback);
      if (connection !== 'none') {
        url += '&connection=' + connection;
      }

      window.open(url, '_blank');
    };

    this['nativelogin'] = function () {

      var connection = $('#connection-nativelogin-selector option:selected').val();

      var url = urljoin(client.namespace,
                        '/authorize',
                        '?response_type=token&client_id=' + client.clientID +
                        '&redirect_uri='  + client.callback);
      if (connection !== 'none') {
        url += '&connection=' + connection;
      }

      window.open(url, '_blank');
    };

    this['allclients'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace, '/api/clients?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['clientcreate'] = function () {
      var valid = $("#create-client-form")[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var callbacks = $.map($('#api-create-client-callbacks').val().split(','), function (c) {
        return c.trim();
      });

      var newClient = {
        name: $('#api-create-client-name').val().trim(),
        callbacks: callbacks
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/clients/',
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(newClient)
        });

      });
    };

    this['clientupdate'] = function () {
      var clientID = client.clientID;
      var callbacks = $.map($('#api-update-client-callbacks').val().split(','), function (c) {
        return c.trim();
      });

      var updatedClient = {
        name: $('#api-update-client-name').val().trim(),
        callback: callbacks[0],
        callbacks: callbacks.splice(1)
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/clients/' + clientID,
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(updatedClient)
        });

      });
    };

    function switchJSONEditor(on) {
      var tmpVal = $('#sdk-create-jsoneditor textarea').val();

      switch(on) {
        case true:
          $('#sdk-create-jsoneditor textarea').val('{' + tmpVal + '}');
          break;
        case false:
          // workaround to show extra attributes (metadata)
          $('#sdk-create-jsoneditor textarea').val(
            $.trim(tmpVal.replace(/[\{\}]/g,'').replace(/ +?/g, '')));
          break;
      }
    }

    this['usercreate'] = function () {
      var connection = $('#api-create-user-connection-selector option:selected').val();

      var user = {
        email: $('#api-create-user-email').val(),
        password: $('#api-create-user-password').val(),
        connection: connection,
        email_verified: $('#api-create-user-email-verified-selector option:selected').val() === 'true'
      };

      try {
        switchJSONEditor(true);
        var metadata =  window.createJSONEditor.get();
        if (metadata) user = $.extend(user, metadata);
        switchJSONEditor(false);
      } catch (err) {
        switchJSONEditor(false);
        $('#usercreate-result').text('Wrong extra attributes');
        $('#usercreate-result').parent().addClass('error');
        return;
      }

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users',
                          '?access_token=' + token.access_token);
        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['user-sendverificationemail'] = function () {
      var connection = $('#api-user-sendverificationemail-selector option:selected').val();

      var body = {
        email: $('#api-user-sendverificationemail-email').val(),
        connection: connection,
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/send_verification_email',
                          '?access_token=' + token.access_token);
        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(body)
        });

      });
    };

    this['user-verificationticket'] = function () {
      var user_id = $('#user-id-selector-for-verificationticket option:selected').val();
      var body = {
        resultUrl: $('#api-user-verificationticket-resultUrl').val()
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/' + user_id + '/verification_ticket',
                          '?access_token=' + token.access_token);
        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(body)
        });

      });
    };

    this['user-changepasswordticket'] = function () {
      var user_id = $('#user-id-selector-for-changepasswordticket option:selected').val();

      var body = {
        newPassword: $('#api-user-changepasswordticket-newPassword').val(),
        resultUrl: $('#api-user-changepasswordticket-resultUrl').val()
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/' + user_id + '/change_password_ticket',
                          '?access_token=' + token.access_token);
        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(body)
        });

      });
    };

    this['usermetadataupdate'] = function () {
      var user_id = $('#user-id-selector option:selected').val();
      var metadata = {};

      try {
        metadata = window.updateJSONEditor.get();
      } catch (err) {
        $('#usermetadataupdate-result').text('Wrong body');
        $('#usermetadataupdate-result').parent().addClass('error');
        return;
      }

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/' + user_id + '/metadata',
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(metadata)
        });

      });
    };


    this['usermetadatapatch'] = function () {
      var user_id = $('#user-patch-selector option:selected').val();
      var metadata = {};

      try {
        metadata = window.updatePatchJSONEditor.get();
      } catch (err) {
        $('#usermetadatapatch-result').text('Wrong body');
        $('#usermetadatapatch-result').parent().addClass('error');
        return;
      }

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/' + user_id + '/metadata',
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'PATCH',
          contentType: 'application/json',
          data: JSON.stringify(metadata)
        });

      });
    };

    this['userpasswordupdate'] = function () {
      var user_id = $('#update-user-id-selector option:selected').val();

      var user = {
        password: $('#api-update-user-password').val(),
        verify: $('#api-update-user-password-verify-selector option:selected').val() === 'true'
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace, 
                          '/api/users/' + user_id + '/password', 
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url, 
          type: 'PUT', 
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['useremailupdate'] = function () {
      var user_id = $('#update-user-id-selector-for-changeemail option:selected').val();

      var user = {
        email: $('#api-update-user-email').val(),
        verify: $('#api-update-user-email-verify-selector option:selected').val() === 'true'
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/' + user_id + '/email',
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          global: false,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(user)
        });

      });
    };

    this['userdelete'] = function () {
      var user_id = $('#user-id-selector-for-delete option:selected').val();

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/users/' + user_id,
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'DELETE',
          success: function() {
            $('#user-id-selector-for-delete option:selected').remove();
          }
        });
      });
    };

    this['allrules'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace, '/api/rules?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'GET'});
      });
    };

    this['rulecreate'] = function () {
      var valid = $("#create-rule-form")[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var newRule = {
        name: $('#api-create-rule-name').val().trim(),
        status: $('#api-create-rule-status').val() === 'true',
        script: $('#api-create-rule-script').val().trim()
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/rules/',
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(newRule)
        });

      });
    };

    this['ruleupdate'] = function () {
      var valid = $("#update-rule-form")[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var name = $('#rules-put-selector').val().trim();
      var updatedRule = {
        status: $('#api-update-rule-status').val() === 'true',
        script: $('#api-update-rule-script').val().trim()
      };

      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/rules/' + name,
                          '?access_token=' + token.access_token);

        return $.ajax({
          url: url,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(updatedRule)
        });

      });
    };

    this['ruledelete'] = function () {
      return getToken().pipe(function (token) {
        var url = urljoin(client.namespace,
                          '/api/rules/',
                          $('#rule-delete-selector option:selected').val(),
                          '?access_token=' + token.access_token);
        return $.ajax({url: url, type: 'DELETE'});
      });
    };

    this['dbconn-changePassword'] = function () {
      var valid = $("#dbconn-changePassword-form")[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var user = {
        email: $('#dbconn-changePassword-email').val().trim(),
        password: $('#dbconn-changePassword-password').val().trim(),
        connection: $('#dbconn-changePassword-connection-selector').val(),
        debug: $('#dbconn-changePassword-debug').val() === 'true'
      };

      var url = urljoin(client.namespace, '/dbconnections/change_password');

      return $.ajax({
        url: url,
        type: 'POST',
        global: false,
        contentType: 'application/json',
        data: JSON.stringify(user)
      });
    };

    this['dbconn-forgotPassword'] = function () {
      var valid = $("#dbconn-forgotPassword-form")[0].checkValidity();
      if (!valid) {
        // TODO: show required messages
        return;
      }

      var user = {
        email: $('#dbconn-forgotPassword-email').val().trim(),
        password: $('#dbconn-forgotPassword-password').val().trim(),
        connection: $('#dbconn-forgotPassword-connection-selector').val(),
        credentials: {
          id: $('#dbconn-forgotPassword-credentials-id').text().trim(),
          key: $('#dbconn-forgotPassword-credentials-key').text().trim(),
          algorithm: 'sha256'
        },
        debug: $('#dbconn-forgotPassword-debug').val() === 'true'
      };

      var url = urljoin(client.namespace, '/dbconnections/forgot_password');

      return $.ajax({
        url: url, 
        type: 'POST', 
        global: false,
        contentType: 'application/json',
        data: JSON.stringify(user)
      });
    };
  };
});