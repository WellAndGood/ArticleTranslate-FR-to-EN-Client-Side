
let lastExtractedArticle = "";  // Store the extracted text globally in the popup scope
let articleTitle = "";  // Store the article title globally in the popup scope

document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded...');

    const checkbox = document.getElementById('useGoogleTranslate');
    const statusEl = document.getElementById('gtStatus');

    // Load saved value; default true
    chrome.storage.local.get(['useGoogleTranslate'], (res) => {
        const current = res.useGoogleTranslate !== undefined ? !!res.useGoogleTranslate : true;
        checkbox.checked = current;
        if (statusEl) statusEl.textContent = current ? 'Translations enabled' : 'Translations disabled';
    });

    // Keep it up to date when user clicks checkbox
    checkbox.addEventListener('change', () => {
        chrome.storage.local.set({ useGoogleTranslate: checkbox.checked }, () => {
            if (statusEl) statusEl.textContent = checkbox.checked ? 'Translations enabled' : 'Translations disabled';
        });
    });

    const button = document.getElementById("openReader");
    const output = document.getElementById("output");
    const exportButton = document.getElementById("exportButton");

    if (!button) {
        console.error("Button with ID 'openReader' not found in popup.html.");
        return;
    }

    const manualEnterButton = document.getElementById("manualEnter");
    
    const manualTitleLabel = document.getElementById("manualTitleLabel");
    const manualBodyLabel = document.getElementById("manualBodyLabel");

    const manualTitleText = document.getElementById("manualTitleText");
    const manualBodyText = document.getElementById("manualBodyText");

    manualEnterButton.addEventListener("click", () => { 
        const titleStyle = manualTitleText.style.display;
        console.log("Manual Enter button clicked. Current title style:", titleStyle);
        if (titleStyle === "none" || titleStyle === "") {
            manualTitleLabel.style.display = "block";
            manualBodyLabel.style.display = "block";
            manualTitleText.style.display = "block";
            manualBodyText.style.display = "block";
            exportButton.style.display = "block";
            output.textContent = "";
        } else if (titleStyle === "block") {
            manualTitleLabel.style.display = "none";
            manualBodyLabel.style.display = "none";
            manualTitleText.style.display = "none";
            manualBodyText.style.display = "none";
            exportButton.style.display = "none";
        }
    }); 

    button.addEventListener("click", async () => {
        console.log("Button clicked...");

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log("Active tab found:", tab);

        // Step 1: Inject Readability and DOMParser
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["JSDOMParser.js", "Readability.js"]
        });
        console.log("Readability and DOMParser injected.");

        // Step 2: Run Readability on the active page
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: runReadabilitySafely
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                output.textContent = "Error: " + chrome.runtime.lastError.message;
                return;
            }

            console.log("Readability script executed, results:", results);
            let result = results[0]?.result;
            if (!result) return;

            articleTitle = result.title;
            console.log("articleTitle", articleTitle)


            let articleHtml = result.content;         // <-- Readability HTML
            let articleText = headingsToNewlines(articleHtml); // <-- Plain text w/ heading newlines

            articleText = cleanSpacing(articleText);
            articleText = addNewlinesAfterSentences(articleText);
            articleText = improveSpacing(articleText);

            output.textContent = articleText;
            lastExtractedArticle = articleText;

            // ✅ Make export button visible
            exportButton.style.display = "block";
        });
    });

    if (!exportButton) {
        console.error("Export button with ID 'exportButton' not found in popup.html.");
    } else {
        exportButton.addEventListener("click", () => {

            // If manual entry is used, override the last extracted article and title from Readability (which we assumed has not been used)
            if (manualBodyText.value != "") {
                lastExtractedArticle = manualBodyText.value;
                articleTitle = manualTitleText.value;
            } 

            console.log("Export button clicked...");
            if (!lastExtractedArticle) {
                console.warn("No article text available for export.");
                return;
            }

            console.log("article text:", lastExtractedArticle);

            console.log("articleTitle", articleTitle);
            const useGoogleTranslate = checkbox ? !!checkbox.checked : true;

            chrome.storage.local.set({
                exportedArticle: lastExtractedArticle,
                exportedTitle: articleTitle,
                useGoogleTranslate
            }, () => {
                console.log("Article text and title saved to chrome.storage. Opening reader...");
                chrome.tabs.create({
                    url: chrome.runtime.getURL("reader.html")
                });
            });
        });
    }
});

function runReadabilitySafely() {
    try {
        const docClone = document.cloneNode(true);
        const article = new Readability(docClone).parse();
        // console.log("Readability article parsed:", article);
        if (article) {
            return {
                title: article.title,
                content: article.content
            };
        } else {
            return {
                title: "No title found",
                content: "No readable article found."
            };
        }
    } catch (error) {
        return {
            title: "Error",
            content: "Error running Readability: " + error.message
        };
    }
}

function headingsToNewlines(html) {
    // Parse the HTML string safely
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Insert newlines before and after all headings
    doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
        const text = h.textContent.trim();
        const meaningful = text && text.split(/\s+/).length >= 2;
        const nextBlock = h.nextElementSibling;
        const nextIsTexty = nextBlock && /^(P|DIV|UL|OL)$/i.test(nextBlock.tagName) &&
                            (nextBlock.textContent.trim().length > 40);
        if (!meaningful || !nextIsTexty) h.remove(); // heuristic
        h.insertAdjacentText('beforebegin', '\n');
        h.insertAdjacentText('afterend', '.\n');
    });

    // Get plain text; trim and normalize extra blank lines
    return doc.body.textContent
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function cleanSpacing(text) {
    return text.replace(/([.!?,;:])([^\s])/g, '$1 $2');
}

function addNewlinesAfterSentences(text) {
    return text.replace(/([.!?])(\s|$)/g, '$1\n');
}

function improveSpacing(text) {
    return text
        // Add space after sentence-ending punctuation if followed by a capital letter or number (to fix things like "...time.Simon")
        .replace(/([.!?])([A-Z0-9])/g, '$1 $2')

        // Add space after lowercase-letter-to-uppercase-letter transitions without spacing (to fix things like "...amDeath")
        .replace(/([a-z])([A-Z])/g, '$1 $2')

        // Add space after typical heading dash patterns (like "Executive EditorI...")
        .replace(/([a-z])(-\s[A-Z])/g, '$1 $2')

        // Optional: fix extra spaces inside times (fix "10: 00" back to "10:00")
        .replace(/(\d):\s+(\d)/g, '$1:$2')

        // Normalize excessive line breaks
        .replace(/\n{3,}/g, '\n\n');
}