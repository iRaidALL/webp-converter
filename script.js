const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imageComparisonContainer = document.getElementById('image-comparison-container');
const downloadAllZipBtn = document.getElementById('download-all-zip');

let convertedImages = [];

// Handle drag and drop events
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('hover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('hover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('hover');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

async function handleFiles(files) {
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            await processImage(file);
        }
    }
    if (convertedImages.length > 0) {
        downloadAllZipBtn.style.display = 'block';
    }
}

async function processImage(file) {
    const originalFileName = file.name.split('.').slice(0, -1).join('.');
    const originalFileSize = file.size;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert to WebP
                canvas.toBlob(async (blob) => {
                    const webpFileSize = blob.size;
                    const savedPercentage = ((originalFileSize - webpFileSize) / originalFileSize) * 100;

                    const webpImageUrl = URL.createObjectURL(blob);

                    convertedImages.push({
                        name: originalFileName + '.webp',
                        blob: blob
                    });

                    renderComparisonCard({
                        originalSrc: e.target.result,
                        webpSrc: webpImageUrl,
                        originalSize: originalFileSize,
                        webpSize: webpFileSize,
                        savedPercentage: savedPercentage.toFixed(2),
                        fileName: originalFileName + '.webp',
                        webpBlob: blob
                    });
                    resolve();
                }, 'image/webp', 0.8); // 0.8 quality for WebP
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderComparisonCard({ originalSrc, webpSrc, originalSize, webpSize, savedPercentage, fileName, webpBlob }) {
    const card = document.createElement('div');
    card.classList.add('comparison-card');
    card.innerHTML = `
        <h3>${fileName}</h3>
        <img src="${webpSrc}" alt="Converted WebP Image">
        <p>Original Size: <strong>${(originalSize / (1024 * 1024)).toFixed(2)} MB</strong></p>
        <p>Compressed Size: <strong>${(webpSize / 1024).toFixed(2)} KB</strong></p>
        <p class="saved-percentage">Saved ${savedPercentage}%!</p>
        <button class="download-individual" data-filename="${fileName}">Download</button>
    `;
    imageComparisonContainer.appendChild(card);

    card.querySelector('.download-individual').addEventListener('click', () => {
        const url = URL.createObjectURL(webpBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

downloadAllZipBtn.addEventListener('click', async () => {
    // Dynamically import JSZip and FileSaver.js
    const scriptZip = document.createElement('script');
    scriptZip.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.body.appendChild(scriptZip);

    const scriptSaveAs = document.createElement('script');
    scriptSaveAs.src = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';
    document.body.appendChild(scriptSaveAs);

    scriptSaveAs.onload = async () => {
        const zip = new JSZip();
        for (const img of convertedImages) {
            zip.file(img.name, img.blob);
        }

        zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, "sleekwebp_images.zip");
        });
    };
});