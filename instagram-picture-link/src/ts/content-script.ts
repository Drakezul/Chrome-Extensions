const PROFILE_PICTURE_CLASS_NAME = "_rewi8";
const INSTAGRAM_USER_PATH_REGEX = /^(\/[^\/]*\/)$/m;
const INSTAGRAM_IMAGE_LINK = "instagram-image-link";
const INSTAGRAM_PROFILE_PICTURE_LINK = "instagram-profile-picture-link";

let updateGuard = false;

let settings: Settings;

function urlHandler() {
    console.debug("Called urlHandler");
    let url = new URL(document.URL);
    let host = url.host;
    if (host == "www.instagram.com") {
        console.debug("Host is www.instagram.com");
        instagramHandler(url);
    }
}

function instagramHandler(url: URL = new URL(document.URL)) {
    if (url.pathname.startsWith("/p/")) {
        console.debug("URL targets an instagram post");
        InstagramPost.addImageLink();
    } else if (url.pathname === "/") {
        console.debug("URL targets an instagram feed");
        InstagramFeed.addImageLinkToArticles();
    } else {
        console.debug(url.pathname + " is not handled");
    }
}

class InstagramArticle {

    public static replaceFirstTextAreaByImageLink(link: string, context: HTMLElement) {
        let textArea = context.getElementsByTagName("textarea")[0];
        if (textArea && textArea.parentElement && textArea.parentElement.parentElement) {
            let commentSection = textArea.parentElement.parentElement;
            commentSection.innerHTML = "";
            commentSection.appendChild(InstagramArticle.createHtmlLink(link));
        }
    }

    public static createHtmlLink(extractedLink: string) {
        let linkSpan = document.createElement('span');
        let link = document.createElement("a");
        link.href = extractedLink;
        link.classList.add(INSTAGRAM_IMAGE_LINK);
        link.textContent = "Link";
        linkSpan.appendChild(link);
        return linkSpan;
    }

    public static addImageLinkToArticle(article: HTMLElement): void {
        let picturePanel = article.children[2];
        let lists = picturePanel.getElementsByTagName('ul');
        if (lists.length == 1) {
            console.debug("Found list element")
            let slideList = lists[0];
            if (slideList && slideList.parentElement && slideList.parentElement.parentElement) {
                const handleArticleSlide = (_: MutationRecord[]) => {
                    console.debug("Mutation detected")
                    let translateX = slideList.parentElement!.parentElement!.style.transform.replace('translateX(', '').replace('px)', '');
                    if (slideList.children.length > 0 && slideList?.children[0]) {
                        let position = Math.abs(Number.parseInt(translateX) / slideList.children[0].clientWidth);
                        let src = slideList.children[position].getElementsByTagName('img')[0].src;
                        //update link
                        let anchors = article.querySelectorAll('span a.' + INSTAGRAM_IMAGE_LINK);
                        if (anchors && anchors.length > 0) {
                            (anchors[0] as HTMLAnchorElement).href = src;
                        }
                    }
                }
                let articleObserver = new MutationObserver(handleArticleSlide);
                articleObserver.observe(slideList.parentElement.parentElement, { attributes: true });
            }
        }
        InstagramArticle.getImageRef(article, this.replaceFirstTextAreaByImageLink);
    }

    private static getImageRef(article: HTMLElement, callback: (src: string, context: HTMLElement) => void) {
        let img = article.getElementsByTagName("img")[1];
        if (!img || !img.src) {
            setTimeout(() => {
                InstagramArticle.getImageRef(article, callback);
            }, 100);
        } else {
            if (img.complete) {
                callback(img.src, article);
            } else {
                img.onload = () => callback(img.src, article);
            }
        }
    }
}

class InstagramPost {

    public static addImageLink() {
        let articles = document.getElementsByTagName('article');
        InstagramArticle.addImageLinkToArticle(articles[articles.length - 1]);
    }
}

class InstagramFeed {

    public static observer: MutationObserver;

    public static handleFeedMutation = (_?: MutationRecord[]) => {
        let articles = document.getElementsByTagName("article");
        for (let article of articles) {
            InstagramArticle.addImageLinkToArticle(article);
        }
    };

    public static addImageLinkToArticles() {
        if (InstagramFeed.observer) {
            InstagramFeed.observer.disconnect();
        }
        this.handleFeedMutation();
        InstagramFeed.observer = new MutationObserver(this.handleFeedMutation);
        let articlesWrapper = document.getElementsByTagName("article")[0].parentElement;
        InstagramFeed.observer.observe(articlesWrapper!, {
            attributes: false,
            childList: true
        });
    }
}

enum INSTAGRAM {
    POST,
    PROFILE,
    MAIN
}

(function () {
    window.addEventListener("load", urlHandler);
})();

interface Settings {
    skipPrivateInstagramProfiles: boolean
}