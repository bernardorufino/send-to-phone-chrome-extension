chrome.runtime.onMessage.addListener(function(data, sender, reply) {
  switch(data.request) {
    case 'getPageTitle':
      switch (document.location.host) {
        case 'keep.google.com':
          if (document.location.hash.search('^#NOTE/') >= 0) {
            var x = window.innerWidth / 2;
            for (var y = window.innerHeight / 2; y > 0; y -= 100) {
              var elements = document.elementsFromPoint(x, y);
              for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                if (element.style.left != null && element.style.left != "") {
                  try {
                    titlePlaceholder = document.evaluate(
                      './/div[text()="Title"]', 
                      element, 
                      null, 
                      XPathResult.FIRST_ORDERED_NODE_TYPE, 
                      null).singleNodeValue
                    title = titlePlaceholder.nextElementSibling.textContent
                    reply({title: title})
                    return;
                  } catch (e) {
                    // It's not, just keep going
                  }
                }
              }
            }
          }
          break;
      }
      reply({title: document.title})
      break;
  }
});