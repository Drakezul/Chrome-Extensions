document.addEventListener("DOMContentLoaded", function () {
    let url = new URL(document.URL);
    if (url.host == "www.instagram.com") {
        if (url.pathname.startsWith("/p/")) {
            setTimeout(() => { InstagramPost.addImageLink() }, 500);
        } else if (url.pathname === "/") {
            setTimeout(() => { InstagramFeed.addImageLinkToArticles(); }, 500);
        } else if (url.pathname.match(/instagram.com(\/[^\/]*\/)$/m)) {
            //TODO
            //InstagramProfile.addImageLink()
            sendPrivacyStatus();
        } else {
            //TODO
        }
    }
});

chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender, callback: (status: string) => void) {
    if (message == INSTAGRAM.POST) {
        setTimeout(function () {
            InstagramPost.addImageLink();
            callback("Done");
        }, 500);
    } else if (message === INSTAGRAM.PROFILE) {
        setTimeout(() => {
            //TODO add Instagram.Stories
            //sendPrivacyStatus();
            callback("Done");
        }, 500);
    }
});

function sendPrivacyStatus() {
    let mainDiv = document.getElementsByTagName("main")[0].getElementsByTagName("article")[0].children[1];
    if (mainDiv.children.length == 1) {
        chrome.runtime.sendMessage("Private");
    }
}

const instagramDownloadButton = "instagram-download-button";

class InstagramBase {

    public static addProfileLinkToCommentSection(htmlLink: HTMLElement, context: HTMLElement) {
        let textArea = context.getElementsByTagName("textarea")[0];
        if (textArea) {
            let commentSection = textArea.parentElement.parentElement;
            commentSection.innerHTML = "";
            commentSection.appendChild(htmlLink);
        }
    }

    public static createLink(extractedLink: string) {
        let linkSpan = document.createElement("span");
        let link = document.createElement("a");
        link.href = extractedLink;
        link.id = instagramDownloadButton;
        link.textContent = "Link";
        linkSpan.appendChild(link);
        return linkSpan;
    }
}

class InstagramPost extends InstagramBase {

    public static addImageLink() {
        if (!document.getElementById(instagramDownloadButton)) {
            let context = document.getElementsByTagName("body")[0];
            InstagramBase.addProfileLinkToCommentSection(InstagramBase.createLink(InstagramPost.getImageRef()), context);
        }
    }

    private static getImageRef() {
        let images = document.getElementsByTagName("img");
        return images[images.length - 1].getAttribute("src");
    }
}

class InstagramFeed extends InstagramBase {

    public static observer: MutationObserver;
    private static counter = 0;

    public static addImageLinkToArticles() {
        InstagramFeed.observer = new MutationObserver((mutations: MutationRecord[]) => {
            let articles = document.getElementsByTagName("article");
            for (let article of articles) {
                InstagramFeed.addImageLinkToArticle(article);
            }
        });
        let articlesWrapper = document.getElementsByTagName("article")[0].parentElement;
        InstagramFeed.observer.observe(articlesWrapper, {
            attributes: false,
            childList: true
        });
    }

    private static addImageLinkToArticle(article: HTMLElement): void {
        InstagramFeed.getImageRef(article, (link: string) => {
            let wrappedLink = InstagramBase.createLink(link);
            InstagramBase.addProfileLinkToCommentSection(wrappedLink, article);
        });
    }

    private static getImageRef(article: HTMLElement, callback: (src: string) => void) {
        let img = article.getElementsByTagName("img")[1];
        if (!img) {
            setTimeout(() => {
                InstagramFeed.getImageRef(article, callback);
            }, 100);
            return;
        } else {
            img.onload = () => callback(img.getAttribute("src"));
        }
    }
}

enum INSTAGRAM {
    POST,
    PROFILE,
    MAIN
}