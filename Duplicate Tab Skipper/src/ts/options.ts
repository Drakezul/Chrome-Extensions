// Saves options to chrome.storage
function save_options() {
    let backgroundColor = getBackgroundColorInput().value;
    let textColor = getTextColorInput().value;
    setFooterText("Saving");
    console.log(getSkipPrivateInstagramProfilesCheckbox().checked);
    chrome.storage.sync.set({
        spawningPoolBackgroundColor: getBackgroundColorInput().value,
        spawningPoolTextColor: getTextColorInput().value,
        skipPrivateInstagramProfiles: getSkipPrivateInstagramProfilesCheckbox().checked
    }, function () {
        setFooterText("Saved");
        setTimeout(() => {
            setFooterText("");
        }, 1000);
    });
}

function setFooterText(text: string) {
    getFooter().textContent = text;
}

function getFooter(): HTMLDivElement {
    return getHtmlElementById("footer") as HTMLDivElement;
}

function getBackgroundColorInput() {
    return getHTMLInputElement("background-color-option");
}

function getTextColorInput() {
    return getHTMLInputElement("text-color-option");
}

function getSkipPrivateInstagramProfilesCheckbox() {
    return getHTMLInputElement("skip-private-instagram-profiles");
}

function getHTMLInputElement(id: string) {
    return (getHtmlElementById(id) as HTMLInputElement);
}

function getHtmlElementById(id: string) {
    return document.getElementById(id);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        backgroundColor: "#161618",
        textColor: "#1db992",
        skipPrivateInstagramProfiles: false
    }, function (items) {
        getBackgroundColorInput().value = items.backgroundColor;
        getTextColorInput().value = items.textColor;
        getSkipPrivateInstagramProfilesCheckbox().checked = items.skipPrivateInstagramProfiles;
    });
    let options = document.getElementsByClassName("option");
    for (let i = 0; i < options.length; i++) {
        options.item(i).addEventListener("change", save_options);
    }
}
document.addEventListener('DOMContentLoaded', restore_options);