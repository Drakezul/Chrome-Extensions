function getUserBookmarksFromBar(rootNodes: chrome.bookmarks.BookmarkTreeNode[]) {
    return rootNodes[0].children[0];
}

function getUserRootBookmarkFolders(userRootBookmark: chrome.bookmarks.BookmarkTreeNode) {
    return userRootBookmark.children.filter(node => node.children != undefined)
}

function sortNode(node: chrome.bookmarks.BookmarkTreeNode) {
    let nodes = node.children
    if (nodes == undefined) {
        console.log("No children found for ", node)
        return
    }
    let folders = nodes.filter((node) => node.children !== undefined)
    for (let folder of folders) {
        console.log("Sorting folder " + folder.title)
        sortNode(folder)
    }
    let sortedChildren = node.children.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
    for (let childIdx in sortedChildren) {
        let child = sortedChildren[childIdx]
        chrome.bookmarks.move(child.id, { parentId: node.id, index: parseInt(childIdx) })
    }
}

chrome.bookmarks.getTree((rootNodes => sortNode(getUserBookmarksFromBar(rootNodes))));

function logUserBookmarkFolders(rootNodes: chrome.bookmarks.BookmarkTreeNode[]) {
    let folders = getUserRootBookmarkFolders(getUserBookmarksFromBar(rootNodes))
    console.dir(folders)
}
chrome.bookmarks.getTree(logUserBookmarkFolders);

function sortParent(_: string, objectWithParentId: { parentId?: string }) {
    console.log("Sort parent of ", objectWithParentId)
    if (objectWithParentId.parentId == undefined) {
        console.log("No parent found")
        return
    }
    chrome.bookmarks.getSubTree(objectWithParentId.parentId, (results) => {
        console.log("Sorting ", results[0])
        sortNode(results[0]);
    });
}

chrome.bookmarks.onCreated.addListener(sortParent)
chrome.bookmarks.onMoved.addListener(sortParent)