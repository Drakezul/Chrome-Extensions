chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender) {
    if (typeof message == "string") {
        switch (message) {
            case "Private":
                chrome.tabs.remove(sender.tab.id);
                return showNotification(sender.tab, message);
        }
    }/* else {
        switch (message.event) {
            case "Timestamp":
                timestamps.push(message.time);
                let sum = 0;
                for (let i = 1; i < timestamps.length; i++) {
                    sum += timestamps[i] - timestamps[i - 1];
                }
                console.log(sum / (timestamps.length - 1));
                return;
        }
    }*/
});

//var timestamps = [];

chrome.tabs.onCreated.addListener(function (tab) {
    return removeDuplicate(tab);
});

chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.status == "complete") {
        if (removeDuplicate(tab)) {
            return true;
        } else {
            if (tab.url.includes("instagram.com/p/")) {
                chrome.tabs.sendMessage(tab.id, INSTAGRAMS.POST);
            } else if (tab.url.includes("instagram.com/") && !tab.url.endsWith("instagram.com/")) {
                chrome.tabs.sendMessage(tab.id, INSTAGRAMS.PROFILE);
            }
        }
    }
});

function removeDuplicate(tab: chrome.tabs.Tab) {
    chrome.tabs.query({ "url": tab.url }, function (duplicate: chrome.tabs.Tab[]) {
        if (duplicate.length > 1) {
            chrome.tabs.remove(tab.id);
            chrome.tabs.update(duplicate[0].id, { "active": true }, () => { });
            return showNotification(tab, "Duplicate");
        }
    });
}

function showNotification(tab: chrome.tabs.Tab, request: string) {
    var notification = new Notification("Instagram Skipper", {
        icon: 'instagram-icon.png',
        body: request + " " + tab.title.split("•")[0]
    });
    setTimeout(() => {
        notification.close();
    }, 2000);
    return true;
}

enum INSTAGRAMS {
    POST = "POST",
    PROFILE = "PROFILE"
}