chrome.tabs.onCreated.addListener(function (tab) {
    removeDuplicate(tab);
});
chrome.tabs.onUpdated.addListener(function (_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.status == "complete") {
        removeDuplicate(tab, function (tabRemoved) {
            if (tabRemoved) {
                return true;
            }
            console.debug(`Tab with title ${tab.title || "unknown"} at url ${tab.url || "unknown"} at index ${tab.index} could not be removed`)
            return false;
        });
    }
});
function removeDuplicate(tab: chrome.tabs.Tab, callback = (_: boolean) => { }) {
    if (!tab.id) {
        return callback(false)
    }
    let url = tab.url || tab.pendingUrl
    chrome.tabs.query({ "url": url }, function (duplicates: chrome.tabs.Tab[]) {
        if (!duplicates) {
            return
        }
        let lastDuplicate = duplicates.pop()
        if (!lastDuplicate)
            return
        if (duplicates.length > 0) {
            chrome.tabs.update(lastDuplicate.id as number, { "active": true }, () => { });
        }
        for (let duplicate of duplicates) {
            if (duplicate.id) {
                chrome.tabs.remove(duplicate.id as number)
                callback(showNotification(tab, "Duplicate"));
            } else {
                callback(false);
            }
        }
    });
}
function showNotification(tab: chrome.tabs.Tab, request: string, timeout = 3000) {
    chrome.notifications.create("", {
        type: "basic",
        title: "Duplicate Tab Skipper",
        iconUrl: "/icon.png",
        message: `${request}: ${tab.title?.split("•")[0]} at ${tab.url || tab.pendingUrl}`,
    }, (id: string) => {
        setTimeout(() => { chrome.notifications.clear(id) }, timeout);
    });
    return true;
}