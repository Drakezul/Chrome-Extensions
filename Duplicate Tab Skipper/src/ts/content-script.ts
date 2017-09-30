var $: any;
/** check for private profile without permissions */
document.addEventListener("DOMContentLoaded", function () {
    console.log("Content Script");
    if (document.URL.includes("instagram.com")) {
        if (document.URL.includes("instagram.com/p/")) {
            setTimeout(() => { addDownloadButton(false) }, 500);
            console.log("Profile");
        } else if (document.URL.includes("instagram.com") && !document.URL.endsWith(".com/")) {
            getPrivacyStatus();
        }
    } else if (document.URL.includes("directory.io")) {
        //chrome.runtime.sendMessage({ event: "Timestamp", time: new Date().getTime() });
        //1MkupVKiCik9iyfnLrJoZLx9RH4rkF3hnA
        //1PpfcTgYL3UH8hCkfExAVxDtKLZibEJ5AN
        if ($("*:contains('1MkupVKiCik9iyfnLrJoZLx9RH4rkF3hnA')").length === 0) {
            let index = window.location.href.substr("http://directory.io/".length);
            window.location.href = "" + (parseInt(index) + 1);
        } else {
            window.alert("This the page");
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