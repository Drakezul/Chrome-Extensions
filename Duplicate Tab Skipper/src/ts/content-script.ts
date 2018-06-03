const PROFILE_PICTURE_CLASS_NAME = "_rewi8";
const INSTAGRAM_USER_PATH_REGEX = /^(\/[^\/]*\/)$/m;
const INSTAGRAM_DOWNLOAD_BUTTON = "instagram-download-button";
const INSTAGRAM_PROFILE_PICTURE_SRC_LINK = "profile-picture-src-link";

let updateGuard = false;

let settings: Settings;

function urlHandler(param1?: any) {
    let url = new URL(document.URL);
    let host = url.host;
    if (host == "www.instagram.com") {
        instagramHandler(url);
    }
    console.dir(url);
    for (let colorSetting of settings.colorSettings) {
        for (let ruleHost of colorSetting.hosts) {
            if (ruleHost == host) {
                settingsHandler(colorSetting);
            }
        }
    }
    if (host == "lotv.spawningtool.com") {
        console.log("spawningtool");
        document.title = document.title.replace("Spawning Tool:", "");
        // change button action
        let button = document.getElementById("pause-bo-timer") as HTMLButtonElement;
        if (button) {
            button.addEventListener("click", (event) => {
                window.location.reload();
            });
        }
    }
};

function instagramHandler(url: URL = new URL(document.URL)) {
    if (url.pathname.startsWith("/p/")) {
        //post
        InstagramPost.addImageLink();
    } else if (url.pathname === "/") {
        //instagram feed
        InstagramFeed.addImageLinkToArticles();
    } else if (url.pathname.match(INSTAGRAM_USER_PATH_REGEX)) {
        const redirected = InstagramBase.redirectPrivateToProfilePicture();
        if (!redirected) {
            InstagramBase.addProfilePictureLink();
        }
    } else {
        console.log(url.pathname + " is not handled yet");
    }
}

function settingsHandler(colorSetting: ColorSetting) {
    for (let selector of colorSetting.cssSelectors) {
        for (let element of document.querySelectorAll(selector)) {
            let style = (element as HTMLElement).style;
            style.setProperty("background", colorSetting.backgroundColor);
            style.setProperty("color", colorSetting.textColor);
        }
    }
};

class InstagramBase {

    public static getProfileName(profileURL: string): string {
        return new URL(profileURL).pathname.replace(/\//g, "");
    }

    /**
     * returns true, if the profile is private
     */
    public static redirectPrivateToProfilePicture(): boolean {
        let mainDiv = document.getElementsByTagName("h2");
        if (mainDiv.length == 1 && options.skipPrivateInstagramProfiles) {
            const username = this.getProfileName(window.location.href);
            InstagramBase.getProfilePictureLink(function (href: string) {
                window.location.href = href + "?username=" + username;
            });
            return true;
        } else {
            return false;
        }
    }

    public static getProfilePictureHtmlElement() {
        return document.getElementsByTagName("header")[0].getElementsByTagName("img")[0];
    }

    public static addProfilePictureLink(): void {
        const profilePicture = InstagramBase.getProfilePictureHtmlElement();
        const linkElement = document.getElementById(INSTAGRAM_PROFILE_PICTURE_SRC_LINK);
        if (!linkElement && profilePicture && profilePicture.parentElement) {
            InstagramBase.getProfilePictureLink(function (href: string) {
                if (!linkElement) {
                    let wrapper = profilePicture.parentElement.parentElement;
                    let link = document.createElement("a");
                    link.id = INSTAGRAM_PROFILE_PICTURE_SRC_LINK;
                    link.href = href;
                    link.textContent = "Link";
                    link.style.textAlign = "center";
                    link.style.margin = "5px 0px 0px 5px";
                    wrapper.appendChild(link);
                }
            });
        }
    }

    public static getUserId(callback: (userId: string) => void) {
        for (let element of document.getElementsByTagName("script")) {
            if (element.textContent.includes("window._sharedData = ")) {
                let matches = element.textContent.match(/"id":"\d*"/g);
                if (matches.length < 2) {
                    window.location.reload();
                } else {
                    callback(matches[1].split(":")[1].replace(/"/g, ''));
                }
                return;
            }
        }
    }

    public static getProfilePictureLink(callback: (href: string) => void) {
        InstagramBase.getUserId(function (userId: string) {
            let apiAccess = "https://i.instagram.com/api/v1/users/" + userId + "/info/";
            let xhttp = new XMLHttpRequest();
            xhttp.open("GET", apiAccess)
            xhttp.send();
            xhttp.onload = function () {
                let href: string = JSON.parse(xhttp.responseText)["user"]["hd_profile_pic_url_info"]["url"];
                callback(href);
            };
        });
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

(function () {
    window.addEventListener("load", urlHandler);
    chrome.runtime.onMessage.addListener(function (message: any, sender: chrome.runtime.MessageSender, callback: (status: string) => void) {
        if (!updateGuard && message == "INSTAGRAM") {
            updateGuard = true;
            setTimeout(() => {
                updateGuard = false;
                instagramHandler();
                callback("Done");
            }, 500);
        }
    });

    let defaultData = {
        colorSettings: [{
            title: "Pleasent Green",
            hosts: ["lotv.spawningtool.com"],
            cssSelectors: ["body"],
            backgroundColor: "#161618",
            textColor: "#1db992"
        }],
        skipPrivateInstagramProfiles: false
    };
    chrome.storage.sync.get(defaultData, function (items: Settings) {
        settings = items;
    });
})();

interface Settings {
    colorSettings: ColorSetting[],
    skipPrivateInstagramProfiles: boolean
}

interface ColorSetting {
    title: string,
    hosts: string[],
    cssSelectors: string[],
    backgroundColor?: string,
    textColor?: string
}