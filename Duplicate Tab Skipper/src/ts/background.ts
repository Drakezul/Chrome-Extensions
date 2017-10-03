chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender) {
    if (typeof message == "string") {
        switch (message) {
            case "Private":
                chrome.tabs.remove(sender.tab.id);
                return showInstagramNotification(sender.tab, message);
        }
    }
});

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
    /*if (tabOnHost(tab, ["pr0gramm.com", "directory.io", "youtube.com", "twitch.tv", "weareone.fm"])) {
        console.log("Deleting url: " + tab.url);
        chrome.history.deleteUrl({ url: tab.url });
    }*/
});

/*function tabOnHost(tab: chrome.tabs.Tab, hosts: string[]): boolean {
    for (let url of hosts) {
        let host = new URL(tab.url).host;
        if (host == url || host == "www." + url) {
            return true;
        }
    }
    return false;
}*/

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