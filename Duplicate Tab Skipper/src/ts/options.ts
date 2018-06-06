const SKIP_PRIVATE_INSTAGRA_PROFILE_CHECKBOX_ID = "skip-private-instagram-profiles";

let options: Settings;
const defaultColor = "#0080ff";

// Saves options to chrome.storage
function save_options() {
    console.dir(options);
    chrome.storage.sync.set(options, function () {
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

function getColorSettings() {

}

function getSkipPrivateInstagramProfilesCheckbox(): HTMLInputElement {
    return getHTMLInputElement(SKIP_PRIVATE_INSTAGRA_PROFILE_CHECKBOX_ID);
}

function getHTMLInputElement(id: string) {
    return (getHtmlElementById(id) as HTMLInputElement);
}

function getHtmlElementById(id: string) {
    return document.getElementById(id);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function open() {
    // Use default value color = 'red' and likesColor = true.
    let defaultOptions: Settings = {
        colorSettings: [{
            title: "Pleasent Green",
            hosts: ["lotv.spawningtool.com"],
            cssSelectors: ["body"],
            backgroundColor: "#161618",
            textColor: "#1db992"
        }],
        skipPrivateInstagramProfiles: false
    }
    let initSettingsWindow = function (data: Settings) {
        if (data.colorSettings.length == 0) {
            data.colorSettings = defaultOptions.colorSettings;
        }
        options = data;
        buildUI(options);
    }
    chrome.storage.sync.get(defaultOptions, initSettingsWindow);
}

function buildUI(settings: Settings) {
    let settingsDiv = document.getElementById("settings");
    for (let colorSetting of settings.colorSettings) {
        let group: ColorSettingsGroup = new ColorSettingsGroup(colorSetting);
        settingsDiv.appendChild(group.groupDiv);
    }
    let instagramSkipCheckboxRow = createSkipPrivateInstagramProfilesOption(settings.skipPrivateInstagramProfiles);
    settingsDiv.appendChild(instagramSkipCheckboxRow);
    settingsDiv.insertBefore(createAddNewColorGroupPanel(), instagramSkipCheckboxRow);
}

function createAddNewColorGroupPanel(): HTMLDivElement {
    let panel = document.createElement("div");
    panel.classList.add("add-color-group-panel")

    let emptyInput = document.createElement("input");
    emptyInput.type = "text";
    emptyInput.placeholder = "Create new color group";

    let addButton = document.createElement("button");
    addButton.textContent = "+"

    let addNewGroup = function (event: any) {
        if (event.key == "Enter" || event instanceof MouseEvent) {
            if (emptyInput.value.length > 0) {
                let settingsDiv = document.getElementById("settings");
                let group: ColorSettingsGroup = new ColorSettingsGroup({
                    cssSelectors: [],
                    hosts: [],
                    title: emptyInput.value
                });
                options.colorSettings.push(group.colorSetting);
                settingsDiv.insertBefore(group.groupDiv, panel);
            } else {
                let style = emptyInput.style;
                style.setProperty("border", "2px solid red");
                style.setProperty("outline", "none");
                setTimeout(() => {
                    style.removeProperty("outline");
                    style.removeProperty("border");
                }, 1000)
            }
        }
    }
    addButton.addEventListener("click", addNewGroup);
    emptyInput.addEventListener("keypress", addNewGroup);

    panel.appendChild(emptyInput);
    panel.appendChild(addButton);
    return panel;
}

function createSkipPrivateInstagramProfilesOption(value: boolean): HTMLDivElement {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = SKIP_PRIVATE_INSTAGRA_PROFILE_CHECKBOX_ID;
    checkbox.checked = value;
    checkbox.classList.add("mandatory-setting");
    checkbox.classList.add("checkbox");
    checkbox.addEventListener("change", function () {
        options.skipPrivateInstagramProfiles = checkbox.checked;
        save_options();
    });

    let div = document.createElement("div");
    div.classList.add("single-setting");
    div.appendChild(getLabel("Zoom private profile picture", checkbox.id));
    div.appendChild(checkbox);
    return div;
}

function getLabel(text: string, labelForId: string): HTMLLabelElement {
    let label = document.createElement("label");
    label.textContent = text;
    label.setAttribute("for", labelForId);
    return label;
}

document.addEventListener('DOMContentLoaded', open);

/* ui */

class ColorSettingsGroup {

    public groupDiv: HTMLDivElement;

    /**
     * @param colorSetting the color setting to initialize with
     */
    constructor(public colorSetting: ColorSetting) {
        this.groupDiv = this.getColorGroupElement(colorSetting.title.toLowerCase().replace(" ", "-"));
        this.groupDiv.appendChild(this.getTitleElement(colorSetting.title));
        this.groupDiv.appendChild(this.getColorSettingsPanel(colorSetting.backgroundColor, colorSetting.textColor));
        this.groupDiv.appendChild(this.getListPanel(colorSetting.cssSelectors, "selectors"));
        this.groupDiv.appendChild(this.getListPanel(colorSetting.hosts, "hosts"));
    }

    private getListPanel(entries: string[], listName: string): HTMLDivElement {
        let listPanel = document.createElement("div");
        let removeButtonAction = function () {
            let row = document.getElementById((this as HTMLElement).getAttribute("rowRef"));
            entries.splice(entries.indexOf(row.getElementsByTagName("label")[0].textContent), 1);
            row.remove();
            save_options();
        }
        for (let i = 0; i < entries.length; i++) {
            listPanel.appendChild(this.getListRow(entries[i], i, listName, removeButtonAction));
        }
        listPanel.appendChild(this.addNewItemListRow(entries, listPanel, listName, removeButtonAction));
        listPanel.classList.add(listName);
        return listPanel;
    }

    private addNewItemListRow(entries: string[], parent: HTMLDivElement, listName: string, removeButtonAction: () => void): HTMLSpanElement {
        let index = entries.length;
        let self = this;
        let emptyInput = document.createElement("input");
        emptyInput.type = "text";
        emptyInput.placeholder = listName;
        let addNewElement = function (event) {
            if (event.key == "Enter" || event instanceof MouseEvent) {
                if (emptyInput.value.length > 0) {
                    parent.insertBefore(self.getListRow(emptyInput.value, index, listName, removeButtonAction), parent.childNodes[index]);
                    entries.push(emptyInput.value);
                    index++;
                    emptyInput.value = "";
                    emptyInput.placeholder = listName;
                    save_options();
                    event.preventDefault();
                } else {
                    emptyInput.placeholder = "Empty " + listName + " permitted";
                }
            }
        }
        emptyInput.addEventListener("keypress", addNewElement);
        let addButton = document.createElement("button");
        addButton.textContent = "+";
        addButton.addEventListener("click", addNewElement);
        let row = this.getListRowBase();
        row.appendChild(emptyInput);
        row.appendChild(addButton);
        return row;
    }

    private getListRow(selector: string, index: number, listName: string, removeButtonAction: () => void): HTMLSpanElement {
        let row = this.getListRowBase();
        row.id = this.groupDiv.id + "-" + listName + "-row-" + index;
        let removeButton = this.getRemoveButton(row.id, removeButtonAction);
        row.appendChild(getLabel(selector, removeButton.id));
        row.appendChild(removeButton);
        return row;
    }

    private getListRowBase(): HTMLSpanElement {
        let row = document.createElement("div");
        row.classList.add("list-entry");
        row.classList.add("selector-row");
        return row;
    }

    private getRemoveButton(forId: string, removeButtonAction: () => void): HTMLButtonElement {
        let removeButton = document.createElement("button");
        removeButton.id = forId + "-remove";
        removeButton.setAttribute("rowRef", forId);
        //utf8 waste bucket
        removeButton.textContent = "X"
        removeButton.title = "Remove";
        removeButton.addEventListener("click", removeButtonAction);
        return removeButton;
    }

    private getColorGroupElement(name: string): HTMLDivElement {
        let groupId = name + "-color-settings-group";
        let groupDiv = document.createElement("div");
        groupDiv.id = groupId;
        groupDiv.classList.add("color-settings");
        groupDiv.classList.add("settings-group");
        return groupDiv;
    }

    private getTitleElement(name: string): HTMLHeadingElement {
        let groupTitle = document.createElement("h3");
        groupTitle.id = this.groupDiv.id + "-title";
        groupTitle.textContent = name;
        groupTitle.align = "center";
        groupTitle.title = "Remove group with mouswheel click";
        groupTitle.classList.add("color-group-title");
        groupTitle.classList.add("title");
        let self = this;
        groupTitle.addEventListener("mousedown", function (event) {
            if (event.button == 1) {
                event.preventDefault();
                options.colorSettings.splice(options.colorSettings.indexOf(self.colorSetting), 1);
                self.groupDiv.remove();
                save_options();
            }
        });
        return groupTitle;
    }

    private getColorSettingsPanel(backgroundColor: string = defaultColor, textColor: string = defaultColor): HTMLDivElement {
        let backgroundColorWrapper = this.getColorPickerWrapper("Background", backgroundColor);
        let textColorWrapper = this.getColorPickerWrapper("Text", textColor);

        let colorSettingDiv = document.createElement("div");
        colorSettingDiv.appendChild(backgroundColorWrapper);
        colorSettingDiv.appendChild(textColorWrapper);
        colorSettingDiv.classList.add("color-settings-panel");
        return colorSettingDiv;
    }

    private getColorPickerWrapper(label: string, value: string) {
        let pickerElement = this.getColorPickerInputElement(label, value);
        let labelElement = getLabel(label, pickerElement.id);
        let wrapper = document.createElement("div");
        wrapper.appendChild(labelElement);
        wrapper.appendChild(pickerElement);
        wrapper.classList.add("color-picker-wrapper");
        return wrapper;
    }

    private getColorPickerInputElement(label: string, defaultValue: string) {
        let colorInput = document.createElement("input");
        colorInput.id = this.groupDiv.id + "-" + label.toLowerCase();
        colorInput.type = "color"
        colorInput.value = defaultValue;
        colorInput.addEventListener("change", save_options);
        return colorInput;
    }

}
/* model */

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