function getUserBookmarksFromBar(rootNodes: chrome.bookmarks.BookmarkTreeNode[]) {
    return rootNodes[0].children[0];
}

interface ChapterBookmarkTreeNode extends chrome.bookmarks.BookmarkTreeNode {
    chapter?: number;
}

const DEFAULT_REGEX = "(\\d+\\-\\d+|\\d+\\.\\d+|\\d+)"

const HOSTS_WITH_CUSTOM_REGEX = [
    {
        host: "reaperscans.com",
        regex: "chapter\\-" + DEFAULT_REGEX
    },
    {
        host: "www.asurascans.com",
        regex: "chapter\\-" + DEFAULT_REGEX
    }
]

function chapterDedupeChilds(node: chrome.bookmarks.BookmarkTreeNode) {
    let nodes = node.children
    if (nodes == undefined) {
        console.log("No children found for ", node)
        return
    }
    let folders = nodes.filter((node) => node.children !== undefined)
    for (let folder of folders) {
        console.log("Recursing to folder " + folder.title)
        chapterDedupeChilds(folder)
    }
    let nonFolderChildren = nodes.filter((node) => node.children === undefined)
    let urlBasePathIndex: { [baseUrl: string]: ChapterBookmarkTreeNode } = {}
    for (let child of nonFolderChildren) {
        let url = new URL(child.url)

        let regex = HOSTS_WITH_CUSTOM_REGEX.find((mapping) => mapping.host == url.host)?.regex || DEFAULT_REGEX

        let match = url.pathname.match(regex)
        if (match === null) {
            console.log("No match for ", url)
            continue
        }
        let chapter = parseFloat(match[1].replace("-", "."))

        let basePath = url.pathname.substring(0, match.index)

        if (basePath in urlBasePathIndex) {
            if (urlBasePathIndex[basePath].chapter > chapter) {
                chrome.bookmarks.remove(child.id)
                console.log("Removed ", child)
            } else {
                chrome.bookmarks.remove(urlBasePathIndex[basePath].id)
                console.log("Removed ", urlBasePathIndex[basePath])
            }
        } else {
            urlBasePathIndex[basePath] = child
            urlBasePathIndex[basePath].chapter = chapter
        }
        // let m = url.pathname.match("(?:.*?)(\\d+\\-\\d+|\\d+\\.\\d+|\\d+)[a-zA-Z\\-]*\\/?\\??.*$")
    }
}


function dedupeSiblings(_: string, objectWithParentId: { parentId?: string }) {
    console.log("Dedupe siblings of ", objectWithParentId)
    if (objectWithParentId.parentId == undefined) {
        console.log("No parent found")
        return
    }
    chrome.bookmarks.getSubTree(objectWithParentId.parentId, (results) => {
        console.log("Deduping children of ", results[0])
        chapterDedupeChilds(results[0]);
    });
}

function dedupeSiblingsCreate(_: string, bookmark: chrome.bookmarks.BookmarkTreeNode) {
    console.log("dedupeSiblingsCreate")
    dedupeSiblings(_, bookmark)
}

function dedupeSiblingsMove(_: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo) {
    console.log("dedupeSiblingsMove")
    dedupeSiblings(_, moveInfo)
}

chrome.bookmarks.onCreated.addListener(dedupeSiblingsCreate)
chrome.bookmarks.onMoved.addListener(dedupeSiblingsMove)

// initial execution
chrome.bookmarks.getTree((rootNodes => chapterDedupeChilds(getUserBookmarksFromBar(rootNodes))));