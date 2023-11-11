function getUserBookmarksFromBar(rootNodes: chrome.bookmarks.BookmarkTreeNode[]) {
    return rootNodes[0].children[0];
}

interface ChapterBookmarkTreeNode extends chrome.bookmarks.BookmarkTreeNode {
    chapter?: number;
}

const BASE_REGEX = "(\\d+\\-\\d+|\\d+\\.\\d+|\\d+)"
const DEFAULT_REGEX = "chapter\\-" + BASE_REGEX

// const HOSTS_WITH_CUSTOM_REGEX = [
//     {
//         hosts: ["reaperscans.com", "asurascans.com", "asuratoon.com", "asura.gg", "luminousscans.gg"],
//         regex: "chapter\\-" + DEFAULT_REGEX
//     }
// ]

function parseChapterNumberFromMatch(chapterNo: string) {
    return parseFloat(chapterNo.replace("-", "."))
}

function manageIndexAndKeepLaterChapter(node: chrome.bookmarks.BookmarkTreeNode, chapter: number, base: string, index: { [base: string]: ChapterBookmarkTreeNode }) {
    if (base in index) {
        if (index[base].chapter > chapter) {
            chrome.bookmarks.move(node.id, { parentId: todaysArchiveN.id })
            console.log("Moved existing ", node, "to archive ", todaysArchiveN.title)
        } else {
            chrome.bookmarks.move(index[base].id, { parentId: todaysArchiveN.id })
            console.log("Removed newly created node ", index[base])
        }
    } else {
        index[base] = node
        index[base].chapter = chapter
    }
}

function matchTitle(node: chrome.bookmarks.BookmarkTreeNode, titleIndex: { [baseTitle: string]: ChapterBookmarkTreeNode }) {
    let title = node.title
    let match = title.match(/(.*)chapter (\d+\.?\d+)(.*)/i)
    if (match === null) {
        console.log("No title match for ", node.title)
        return false
    }
    let chapter = parseChapterNumberFromMatch(match[2])
    
    let baseTitle = match[0].replace(match[2], "").toLowerCase()
    if (match[1].length > 0){
        baseTitle = match[1]
    }    
    console.debug("Base title ", baseTitle)

    manageIndexAndKeepLaterChapter(node, chapter, baseTitle, titleIndex)
    return true
}

function matchUrl(node: chrome.bookmarks.BookmarkTreeNode, urlBasePathIndex: { [baseUrl: string]: ChapterBookmarkTreeNode }) {
    let url = new URL(node.url)
    let match = url.pathname.match(DEFAULT_REGEX)
    if (match === null) {
        console.log("No match for ", url)
        return false
    }
    let chapter = parseChapterNumberFromMatch(match[1])
    let basePath = url.pathname.substring(0, match.index).toLowerCase()
    console.debug("Base path ", basePath)

    manageIndexAndKeepLaterChapter(node, chapter, basePath, urlBasePathIndex)
    return true
}

function removeDuplicates(nonFolderChildren: chrome.bookmarks.BookmarkTreeNode[]) {
    let urlBasePathIndex: { [baseUrl: string]: ChapterBookmarkTreeNode } = {}
    let titleIndex: { [baseTitle: string]: ChapterBookmarkTreeNode } = {}
    for (let child of nonFolderChildren) {
        if (matchTitle(child, titleIndex)) {
            continue
        }
        matchUrl(child, urlBasePathIndex)
    }
}

function dedupeExactMatch(node: chrome.bookmarks.BookmarkTreeNode) {
    let childs = node.children || []
    let urls = new Set()
    for (let child of childs) {
        if (child.children) {
            dedupeExactMatch(child)
        } else {
            if (urls.has(child.url)) {
                chrome.bookmarks.remove(child.id)
            } else {
                urls.add(child.url)
            }
        }
    }
}

function chapterDedupeChilds(node: chrome.bookmarks.BookmarkTreeNode) {
    let nodes = node.children
    if (nodes == undefined) {
        console.log("No children found for ", node)
        return
    }
    if (node.title.startsWith("_")) {
        console.log("Aborting dedupe and recursion for " + node.title)
        return
    }
    if (node.title === archiveTitle || node.parentId == archiveN.id) {
        console.log("Found archive, going for exactMatch dedupe")
        return dedupeExactMatch(node)
    }
    let folders = nodes.filter((node) => node.children !== undefined)
    for (let folder of folders) {
        console.log("Recursing to folder " + folder.title)
        chapterDedupeChilds(folder)
    }
    let nonFolderChildren = nodes.filter((node) => node.children === undefined)
    removeDuplicates(nonFolderChildren)
    // let m = url.pathname.match("(?:.*?)(\\d+\\-\\d+|\\d+\\.\\d+|\\d+)[a-zA-Z\\-]*\\/?\\??.*$")
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
    console.log("Done with dedupeSiblingsCreate")
}

function dedupeSiblingsMove(_: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo) {
    console.log("dedupeSiblingsMove")
    dedupeSiblings(_, moveInfo)
    console.log("Done with dedupeSiblingsMove")
}

chrome.bookmarks.onCreated.addListener(dedupeSiblingsCreate)
chrome.bookmarks.onMoved.addListener(dedupeSiblingsMove)

const archiveTitle = "Archive"
let archiveN: chrome.bookmarks.BookmarkTreeNode = undefined;
let todaysArchiveN: chrome.bookmarks.BookmarkTreeNode = undefined;
// initial execution
chrome.bookmarks.getTree((rootNodes) => {
    let userBookmarks = getUserBookmarksFromBar(rootNodes)
    archiveN = userBookmarks.children.find((node) => (node.title === archiveTitle))
    if (!archiveN) {
        chrome.bookmarks.create({
            parentId: userBookmarks.id,
            title: archiveTitle
        }, (newNode) => (archiveN = newNode))
    }
    let todaysDate = new Date().toISOString().split("T")[0];
    todaysArchiveN = archiveN.children.find((node) => node.title === todaysDate)
    if (!todaysArchiveN) {
        chrome.bookmarks.create({
            parentId: archiveN.id,
            title: todaysDate
        }, (newNode) => (todaysArchiveN = newNode))
    }
    chapterDedupeChilds(userBookmarks)
});