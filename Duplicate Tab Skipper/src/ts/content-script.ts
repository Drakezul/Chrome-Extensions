const PROFILE_PICTURE_CLASS_NAME = "_9bt3u";
const INSTAGRAM_USER_PATH_REGEX = /^(\/[^\/]*\/)$/m;
const INSTAGRAM_DOWNLOAD_BUTTON = "instagram-download-button";
const INSTAGRAM_PRIVATE_PROFILE_CLASS_NAME = "_q8pf2 _r1mv3";
const INSTAGRAM_PROFILE_PICTURE_SRC_LINK = "profile-picture-src-link";

const instagramHandler = function (param1?: any) {
    let url = new URL(document.URL);
    if (url.host == "www.instagram.com") {
        if (url.pathname.startsWith("/p/")) {
            //post
            InstagramPost.addImageLink();
        } else if (url.pathname === "/") {
            //instagram feed
            InstagramFeed.addImageLinkToArticles();
        } else if (url.pathname.match(INSTAGRAM_USER_PATH_REGEX)) {
            const isPrivate = InstagramBase.redirectPrivateToProfilePicture();
            if (!isPrivate) {
                InstagramBase.addProfilePictureLink();
            }
        } else {
            console.log(url.pathname + " is not handled yet");
        }
    }
};

window.addEventListener("load", instagramHandler);

let updateGuard = false;

chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender, callback: (status: string) => void) {
    if (!updateGuard && message == "INSTAGRAM") {
        updateGuard = true;
        setTimeout(() => {
            updateGuard = false;
            instagramHandler();
            console.dir("invoked handler");
            callback("Done");
        }, 500);
    }
});

class InstagramBase {

    /**
     * returns true, if the profile is private
     */
    public static redirectPrivateToProfilePicture(): boolean {
        let mainDiv = document.getElementsByClassName(INSTAGRAM_PRIVATE_PROFILE_CLASS_NAME);
        if (mainDiv.length == 1) {
            const username = window.location.pathname.replace(/\//g, "");
            window.location.href = InstagramBase.get1080ResolutionSource(InstagramBase.getProfilePictureHtmlElement()) + "?username=" + username;
            return true;
        } else {
            return false;
        }
    }

    public static getProfilePictureHtmlElement() {
        return document.getElementsByClassName(PROFILE_PICTURE_CLASS_NAME)[0];
    }

    public static addProfilePictureLink(): void {
        if (!document.getElementById(INSTAGRAM_PROFILE_PICTURE_SRC_LINK)) {
            const profilePicture = InstagramBase.getProfilePictureHtmlElement();
            if (profilePicture && profilePicture.parentElement) {
                let wrapper = profilePicture.parentElement.parentElement;
                let link = document.createElement("a");
                link.id = INSTAGRAM_PROFILE_PICTURE_SRC_LINK;
                link.href = InstagramBase.get1080ResolutionSource(profilePicture);
                link.textContent = "Link";
                link.style.textAlign = "center";
                link.style.margin = "5px 0px 0px 5px";
                wrapper.appendChild(link);
            }
        }
    }

    public static get1080ResolutionSource(element: Element): string {
        return element.getAttribute("src").replace("vp/", "").replace("s150x150", "s1080x1080");
    }

    public static addLinkToCommentSection(htmlLink: HTMLElement, context: HTMLElement) {
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
        link.id = INSTAGRAM_DOWNLOAD_BUTTON;
        link.textContent = "Link";
        linkSpan.appendChild(link);
        return linkSpan;
    }
}

class InstagramPost extends InstagramBase {

    public static addImageLink() {
        if (!document.getElementById(INSTAGRAM_DOWNLOAD_BUTTON)) {
            let context = document.getElementsByTagName("body")[0];
            InstagramBase.addLinkToCommentSection(InstagramBase.createLink(InstagramPost.getImageRef()), context);
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
        if (InstagramFeed.observer) {
            InstagramFeed.observer.disconnect();
        }
        const mutationHandler = (mutations?: MutationRecord[]) => {
            let articles = document.getElementsByTagName("article");
            for (let article of articles) {
                InstagramFeed.addImageLinkToArticle(article);
            }
        };
        mutationHandler();
        InstagramFeed.observer = new MutationObserver(mutationHandler);
        let articlesWrapper = document.getElementsByTagName("article")[0].parentElement;
        InstagramFeed.observer.observe(articlesWrapper, {
            attributes: false,
            childList: true
        });
    }

    private static addImageLinkToArticle(article: HTMLElement): void {
        InstagramFeed.getImageRef(article, (link: string) => {
            let wrappedLink = InstagramBase.createLink(link);
            InstagramBase.addLinkToCommentSection(wrappedLink, article);
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