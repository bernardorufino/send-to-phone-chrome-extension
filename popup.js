User = {
  email: null,
  devices: [],

  getDevice: function(id) {
    for (var i = 0; i < this.devices.length; i++) {
      var device = this.devices[i]
      if (device.id == id) {
        return device;
      }
    }
    return null;
  }
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

function onDeviceItemClick(event) {
  var element = event.target;
  var device = User.getDevice(element.dataset.deviceId)
  var actionType = element.dataset.actionType;

  if (actionType == 'remove') {
    setStatus("Removing " + device.name + "...");
    chrome.runtime.sendMessage({
      request: 'removeDevice',
      deviceId: device.id
    }, function(ans) {
      if (ans.status == 'success') {
        var li = element.parentElement
        li.parentElement.removeChild(li)
        var deviceIndex = User.devices.indexOf(device)
        User.devices.splice(deviceIndex, 1)
        setStatus("Removed", 500);
      } else {
        setStatus("Error removing " + device.name, 1000);
      }
    });
  } else if (actionType == 'notification' || actionType == 'launch') {
    setStatus("Sending to " + device.name + "...");
    chrome.runtime.sendMessage({
      request: 'sendItem',
      deviceId: device.id,
      item: getItem(actionType)
    }, function(ans) {
      if (ans.status == 'success') {
        setStatus("Sent", 500);
      } else {
        setStatus("Error sending page to " + deviceName, 1000);
      }
    });
  }
  
}

function createDeviceItem(device) {
  var li = document.createElement("li");

  var name = document.createElement("span");
  name.className = "name";
  name.textContent = device.name;
  name.dataset.deviceId = device.id;
  name.dataset.actionType = 'notification';
  name.addEventListener("click", onDeviceItemClick);
  li.appendChild(name);
  
  var launch = document.createElement("span");
  launch.className = "icon launch";
  launch.textContent = ".";
  launch.dataset.deviceId = device.id;
  launch.dataset.actionType = 'launch';
  launch.addEventListener("click", onDeviceItemClick);
  launch.addEventListener("mouseover", function() {setPopupTitle('launchCall');});
  launch.addEventListener("mouseout", function() {setPopupTitle('sendCall');});
  li.appendChild(launch);

  var remove = document.createElement("span");
  remove.className = "icon remove";
  remove.textContent = ".";
  remove.dataset.deviceId = device.id;
  remove.dataset.actionType = 'remove';
  remove.addEventListener("click", onDeviceItemClick);
  remove.addEventListener("mouseover", function() {setPopupTitle('removeDevice');});
  remove.addEventListener("mouseout", function() {setPopupTitle('sendCall');});
  li.appendChild(remove);
  
  return li;
}

function setPopupTitle(choosenId) {
  var ids = ['launchCall', 'sendCall', 'removeDevice'];
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
    User.devices.splice(0, User.devices.length)
    for (var i = 0; i < devices.length; i++) {
      var device = devices[i];
      User.devices.push(device);
      var li = createDeviceItem(device);
      Elements.devices.appendChild(li);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  Elements.instructions = document.getElementById("instructions");
  Elements.devices = document.getElementById("devices");
  
  setStatus("Loading...");
  chrome.runtime.sendMessage({request: 'getUserAndPageData'}, function(ans) {
    if (ans.status == 'success') {
      setStatus(null);
      Page.url = ans.data.page.url;
      Page.title = ans.data.page.title;
      User.email = ans.data.user.email;
      console.log('  devices = ' + ans.data.user.devices.length)
      setDevices(ans.data.user.devices);
    } else {
      setStatus("Error loading devices");
    }
  });
});
