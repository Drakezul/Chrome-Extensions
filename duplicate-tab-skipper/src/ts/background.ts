chrome.tabs.onCreated.addListener(removeDuplicate);

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

const overridenUrls = new Map<string, Date>()

function removeDuplicate(tab: chrome.tabs.Tab, didRemove = (_: boolean) => { }) {
    if (!tab.id) {
        return didRemove(false)
    }
    let url = tab.pendingUrl || tab.url
    if (overridenUrls.has(url)) {
        let ageInMs = new Date().getTime() - overridenUrls.get(url).getTime()
        if (ageInMs < 5000) {
            return didRemove(false)
        } else {
            overridenUrls.delete(url)
        }
    }
    chrome.tabs.query({ "url": url }, function (duplicates: chrome.tabs.Tab[]) {
        if (duplicates?.length > 1) {
            chrome.tabs.remove(duplicates[duplicates.length - 1].id)
            didRemove(ShowDuplicateRemovedNotification(tab));
        }
    });
}

function ShowDuplicateRemovedNotification(tab: chrome.tabs.Tab, timeout = 3000) {
    return ShowNotification(tab, "Duplicate", timeout, (clickedNotificationId) => {
        chrome.notifications.onButtonClicked.addListener((notificatonId: string, _: number) => {
            if (clickedNotificationId == notificatonId) {
                let url = tab.pendingUrl || tab.url
                overridenUrls.set(url, new Date())
                chrome.tabs.create({
                    active: true,
                    url: url
                })
            }
        })
    })
}

function ShowNotification(tab: chrome.tabs.Tab, request: string, timeout = 3000, callback?: (notificationId: string) => void) {
    chrome.notifications.create("", {
        type: "basic",
        title: "Duplicate Tab Skipper",
        iconUrl: "/icon.png",
        message: `${request}: ${tab.title?.split("•")[0]} at ${tab.pendingUrl || tab.url}`,
        buttons: [
            {
                title: "Re-open"
            }
        ]
    }, (notificationId: string) => {
        setTimeout(() => { chrome.notifications.clear(notificationId) }, timeout);
        if (callback) {
            callback(notificationId)
        }
    });
    return true;
}