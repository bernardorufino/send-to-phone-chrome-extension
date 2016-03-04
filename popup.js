User = {
  email: null,
  devices: []
}

Elements = {
  instructions: null,
  devices: null
}

Page = {
  url: null,
  title: null
}

function setStatus(content, clearTimeout) {
  var status = document.getElementById('status');
  if (content == null) {
    status.className = 'hidden'
    status.textContent = '';
  } else {
    status.className = ''
    status.textContent = content;
  }
  if (clearTimeout != null) {
    setTimeout(function() {setStatus(null)}, clearTimeout)
  }
}

function getItem(actionType) {
  return {
      type: 'url',
      title: '',
      description: Page.title,
      data: Page.url,
      action_type: actionType
  };
}

function sendItem(deviceIndex, actionType) {
  var deviceId = User.devices[deviceIndex].id;
  var deviceName = User.devices[deviceIndex].name;

  setStatus("Sending to " + deviceName + "...");

  chrome.runtime.sendMessage({
    request: 'sendItem',
    deviceId: deviceId,
    item: getItem(actionType)
  }, function(ans) {
    if (ans.status == 'success') {
      if (200 <= ans.code && ans.code < 300) {
        setStatus("Sent", 500);
      } else {
        setStatus("Error sending page to " + deviceName, 1000);
      }
    } else {
      setStatus("Error sending page to " + deviceName, 1000);
    }
  });
}

function onDeviceItemClick(event) {
  var element = event.target;
  var deviceIndex = element.dataset.deviceIndex;
  var actionType = element.dataset.actionType;
  sendItem(deviceIndex, actionType)
}

function createDeviceItem(deviceIndex) {
  var li = document.createElement("li");
  var name = document.createElement("span");
  name.className = "name";
  name.textContent = User.devices[deviceIndex].name;
  name.dataset.deviceIndex = deviceIndex;
  name.dataset.actionType = 'notification';
  name.addEventListener("click", onDeviceItemClick);
  li.appendChild(name);
  var launch = document.createElement("span");
  launch.className = "launch";
  launch.textContent = ".";
  launch.dataset.deviceIndex = deviceIndex;
  launch.dataset.actionType = 'launch';
  launch.addEventListener("click", onDeviceItemClick);
  launch.addEventListener("mouseover", function() {setPopupTitle('launchCall');});
  launch.addEventListener("mouseout", function() {setPopupTitle('sendCall');});
  li.appendChild(launch);
  return li;
}

function setPopupTitle(choosenId) {
  var ids = ['launchCall', 'sendCall'];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var element = document.getElementById(id);
    element.style.display = (id == choosenId) ? 'block' : 'none';
  }
}

function setDevices(devices) {
  if (devices.length == 0) {
    Elements.instructions.className = "shown";
  } else {
    for (var i = 0; i < devices.length; i++) {
      var device = devices[i];
      User.devices.push(device);
      var li = createDeviceItem(i);
      Elements.devices.appendChild(li);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  Elements.instructions = document.getElementById("instructions");
  Elements.devices = document.getElementById("devices");
  
  setStatus("Loading...");
  chrome.runtime.sendMessage({request: 'getUserAndTabData'}, function(ans) {
    if (ans.status == 'success') {
      setStatus(null);
      Page.url = ans.data.tab.url;
      Page.title = ans.data.tab.title;
      User.email = ans.data.user.email;
      console.log('  devices = ' + ans.data.user.devices.length)
      setDevices(ans.data.user.devices);
    } else {
      setStatus("Error loading devices");
    }
  });
});
