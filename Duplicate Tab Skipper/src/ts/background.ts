chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender) {
    if (typeof message == "string") {
        switch (message) {
            case "Private":
                chrome.tabs.remove(sender.tab.id);
                return showInstagramNotification(sender.tab, message);
        }
    } else if (message.command && message.command == "Clear History") {
        deletion(message.url);
    }
});

function deletion(url: string) {
    chrome.history.search({ text: url, maxResults: 1000 }, function (results) {
        if (results.length > 0) {
            results.forEach((result) => {
                chrome.history.deleteUrl({ url: result.url });
            });
            deletion(url);
        } else {
            console.log("Deletion concluded");
        }
    });
}

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
            return showInstagramNotification(tab, "Duplicate");
        }
    });
}

function showInstagramNotification(tab: chrome.tabs.Tab, request: string) {
    chrome.notifications.create(undefined, {
        title: "Instagram Skipper",
        iconUrl: "instagram-icon.png",
        message: request + " " + tab.title.split("•")[0]
    }, (id: string) => {
        setTimeout(chrome.notifications.clear(id), 2000);
    });
    return true;
}

enum INSTAGRAMS {
    POST = "POST",
    PROFILE = "PROFILE"
}