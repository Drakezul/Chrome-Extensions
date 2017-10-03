document.addEventListener("DOMContentLoaded", function () {
    if (document.URL.includes("instagram.com")) {
        if (document.URL.includes("instagram.com/p/")) {
            setTimeout(() => { addDownloadButton(false) }, 500);
            console.log("Profile");
        } else if (document.URL.includes("instagram.com") && !document.URL.endsWith(".com/")) {
            getPrivacyStatus();
        }
    }
});

chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender, sendResponse) {
    if (message === INSTAGRAM.POST) {
        setTimeout(function () {
            if (document.getElementsByTagName("header").length == 2) {
                addDownloadButton(true);
            } else {
                addDownloadButton(false);
            }
        }, 500);
    } else if (message === INSTAGRAM.PROFILE) {
        setTimeout(getPrivacyStatus, 500);
    }
});

/** Profile */
const instagramDownloadButton = "instagram-download-button";

function addDownloadButton(profile: boolean) {
    if (!document.getElementById(instagramDownloadButton)) {
        let headerIndex = profile ? 1 : 0;
        let header = document.getElementsByTagName("header")[headerIndex];

        let span = header.children[2];
        let downloadSpan = document.createElement("span");
        downloadSpan.setAttribute("class", span.getAttribute("class"));

        header.appendChild(downloadSpan);
        let downloadHref = document.createElement("a");
        downloadHref.href = getImageRef(header);
        downloadHref.id = instagramDownloadButton;
        downloadHref.textContent = "Download";
        downloadSpan.appendChild(downloadHref);
    }
}

function getImageRef(header: HTMLElement) {
    return header.parentElement.children[1].getElementsByTagName("img")[0].src
}

function getPrivacyStatus() {
    let mainDiv = document.getElementsByTagName("main")[0].getElementsByTagName("article")[0].children[1];
    if (mainDiv.children.length == 1) {
        chrome.runtime.sendMessage("Private");
    }
}

declare interface Window {
    _sharedData: any;
}

enum INSTAGRAM {
    POST = "POST",
    PROFILE = "PROFILE"
}