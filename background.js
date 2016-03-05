EMPTY_FUNCTION = function() {};

User = {
  email: null,
  devices: []
}

Service = {

  ENDPOINT: "http://localhost:5000",
  // ENDPOINT: "https://send-to-phone.herokuapp.com",

  getDevices: function(userEmail, callbacks) {
    var xhr = new XMLHttpRequest();
    callbacks = this.reflowCallbacks(callbacks, xhr)
    xhr.open('GET', this.ENDPOINT + '/devices?user_email=' + encodeURIComponent(userEmail));
    xhr.responseType = 'json'
    xhr.onload = callbacks.onload
    xhr.onerror = callbacks.onerror
    xhr.send();
  },

  sendItem: function(deviceId, item, callbacks) {
    var xhr = new XMLHttpRequest();
    callbacks = this.reflowCallbacks(callbacks, xhr)
    xhr.open('POST', this.ENDPOINT + '/devices/' + deviceId + '/send');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = 'json'
    xhr.onload = callbacks.onload
    xhr.onerror = callbacks.onerror
    xhr.send(JSON.stringify(item));
  },

  // Private
  reflowCallbacks: function(callbacks, xhr) {
    if (callbacks.onsuccess == null) callbacks.onsuccess = EMPTY_FUNCTION
    if (callbacks.onerror == null) callbacks.onerror = EMPTY_FUNCTION
    return {
      onload: function(e) {
        if (200 <= xhr.status && xhr.status < 300) {
          callbacks.onsuccess(xhr, e);
        } else {
          callbacks.onerror(xhr, e);
        }
      },
      onerror: function(e) {
        callbacks.onerror(xhr, e);
      }
    }
  }
}

function getUserAndPageData(callbacks) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {request: 'getPageTitle'}, function(res) {
      title = (res != null && res.title != null) ? res.title : tab.title;
      console.log('title = ' + title)
      page = {tab: tab, title: title, url: tab.url}
      getUserData({
        onsuccess: function(xhr, e, user) {
          callbacks.onsuccess(xhr, e, {user: user, page: page});
        },
        onerror: callbacks.onerror
      });
    });
  });
}

function getUserData(callbacks) {
  if (User.email != null && User.devices.length > 0) {
    callbacks.onsuccess(null, null, User);
  } else {
    chrome.identity.getProfileUserInfo(function(userInfo) {
      User.email = userInfo.email;
      Service.getDevices(User.email, {
        onsuccess: function(xhr, e) {
          User.devices = xhr.response.slice();
          callbacks.onsuccess(xhr, e, User);
        },
        onerror: callbacks.onerror
      });
    });
  }
}

function getItem(page, actionType) {
  return {
    type: 'url',
    title: '',
    description: page.title,
    data: page.url,
    action_type: actionType
  }
}

function sendItem(deviceIndex, user, page, actionType) {
  if (deviceIndex >= user.devices.length) return;
  var deviceId = user.devices[deviceIndex].id;
  var item = getItem(page, actionType);
  Service.sendItem(deviceId, item, {});
}

function getCallbacks(reply) {
  return {
    onsuccess: function(xhr, e, data) {
      var code = (xhr != null) ? xhr.status : -1;
      reply({status: 'success', code: code, data: data});
    },
    onerror: function(xhr, e) {
      reply({status: 'error'});
    }
  }
}

chrome.runtime.onMessage.addListener(function(data, sender, reply) {
  switch(data.request) {
    case 'getUserAndPageData':
      getUserAndPageData(getCallbacks(reply));
      return true;
    case 'sendItem':
      Service.sendItem(data.deviceId, data.item, getCallbacks(reply));
      return true;
  }
});

chrome.commands.onCommand.addListener(function(command) {
  var defaultDeviceIndex = 0; // TODO
  switch (command) {
    case 'send':
      getUserAndPageData({onsuccess: function(xhr, e, data) {
          sendItem(defaultDeviceIndex, data.user, data.page, 'notification');
      }});
      break;
    case 'launch':
      getUserAndPageData({onsuccess: function(xhr, e, data) {
          sendItem(defaultDeviceIndex, data.user, data.page, 'launch');
      }});
      break;
  }
});