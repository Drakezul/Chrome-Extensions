function clearHistory(url: string) {
    chrome.runtime.sendMessage({
        command: "Clear History",
        url: url
    });
}

document.addEventListener('DOMContentLoaded', () => {
    let submitButton = document.getElementById("submit-button");
    submitButton.addEventListener("click", (event) => {
        event.preventDefault();
        clearHistory(getUrl());
        window.close();
    });
    document.getElementById("url-input").addEventListener("keyup", function (event) {
        event.preventDefault();
        if (event.keyCode == 13) {
            submitButton.click();
        }
    });
});

function getUrl() {
    return (document.getElementById("url-input") as HTMLInputElement).value;
}

function getSpan() {
    return document.getElementById("url-search");
}