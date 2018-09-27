chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender) {
    if (typeof message == "string") {
        switch (message) {
            case "Private":
                chrome.tabs.remove(sender.tab.id, () => showInstagramNotification(sender.tab, message));
        }
    }
});

chrome.tabs.onCreated.addListener(function (tab) {
    removeDuplicate(tab);
});

chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.status == "complete") {
        removeDuplicate(tab, function (tabRemoved) {
            if (tabRemoved) {
                return true;
            } else {
                if (tabIdGuards.indexOf(tab.id) == -1 && tab.url.includes("instagram.com/")) {
                    chrome.tabs.sendMessage(tab.id, "INSTAGRAM", addGuard(tab.id));
                }
            }
        });
    }
});

var tabIdGuards: number[] = [];

function addGuard(tabId: number) {
    tabIdGuards.push(tabId);
    return function () {
        removeGuard(tabId);
    };
};

function removeGuard(tabId: number) {
    let index = tabIdGuards.indexOf(tabId);
    if (index != -1) {
        tabIdGuards.splice(index, 1);
    }
}

/*function tabOnHost(tab: chrome.tabs.Tab, hosts: string[]): boolean {
    for (let url of hosts) {
        let host = new URL(tab.url).host;
        if (host == url || host == "www." + url) {
            return true;
        }
    }
    return false;
}*/

function removeDuplicate(tab: chrome.tabs.Tab, callback = (tabRemoved: boolean) => { }) {
    chrome.tabs.query({ "url": tab.url }, function (duplicate: chrome.tabs.Tab[]) {
        if (duplicate.length > 1) {
            chrome.tabs.remove(tab.id);
            chrome.tabs.update(duplicate[0].id, { "active": true }, () => { });
            callback(showInstagramNotification(tab, "Duplicate"));
        } else {
            callback(false);
        }
    });
}

function showInstagramNotification(tab: chrome.tabs.Tab, request: string) {
    chrome.notifications.create(undefined, {
        type: "basic",
        title: "Instagram Skipper",
        iconUrl: "https://www.instagram.com/static/images/ico/favicon-192.png/b407fa101800.png",
        message: request + " " + tab.title.split("•")[0]
    }, (id: string) => {
        setTimeout(() => { chrome.notifications.clear(id) }, 2000);
    });
    return true;
}

enum INSTAGRAMS {
    POST,
    PROFILE,
    MAIN
}