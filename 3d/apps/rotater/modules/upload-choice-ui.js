function normalizeIncomingFiles(fileList) {
    return Array.from(fileList || []).filter((file) => {
        const name = String(file?.name || '');
        return /\.(stl|zip)$/i.test(name);
    });
}

function getUploadIncomingLabel(files) {
    const arr = Array.from(files || []).filter(Boolean);
    if (!arr.length) return 'your STL or ZIP files';
    return arr.length > 1 ? `${arr.length} files` : `"${arr[0]?.name || 'file'}"`;
}

export function createUploadChoiceUiController({
    textEl,
    decisionEl,
    actionsRightEl,
    fileListWrapEl,
    fileListEl,
    showMoreBtn,
    previewLimit = 5,
} = {}) {
    let selectedFiles = [];
    let showAllFiles = false;

    const setStepState = (hasFiles) => {
        if (decisionEl) decisionEl.hidden = !hasFiles;
        if (actionsRightEl) actionsRightEl.hidden = !hasFiles;
    };

    const syncPromptText = () => {
        if (!textEl) return;
        if (selectedFiles.length > 0) {
            const incomingLabel = getUploadIncomingLabel(selectedFiles);
            textEl.textContent = `Choose how to load ${incomingLabel}.`;
        } else {
            textEl.textContent = 'Drop STL or ZIP files here, or click Browse.';
        }
    };

    const renderFileList = () => {
        if (!fileListWrapEl || !fileListEl) return;

        fileListEl.textContent = '';
        const total = selectedFiles.length;
        if (!total) {
            fileListWrapEl.hidden = true;
            if (showMoreBtn) showMoreBtn.hidden = true;
            return;
        }

        fileListWrapEl.hidden = false;
        const showAll = showAllFiles || total <= previewLimit;
        const visibleFiles = showAll ? selectedFiles : selectedFiles.slice(0, previewLimit);

        visibleFiles.forEach((file, index) => {
            const item = document.createElement('li');
            item.className = 'upload-choice-file-item';

            const idx = document.createElement('span');
            idx.className = 'upload-choice-file-index';
            idx.textContent = String(index + 1).padStart(2, '0');

            const name = document.createElement('span');
            name.className = 'upload-choice-file-name';
            name.textContent = file?.name || 'Unnamed file';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'upload-choice-file-remove';
            removeBtn.setAttribute('aria-label', `Remove ${file?.name || 'file'}`);
            removeBtn.title = `Remove ${file?.name || 'file'}`;
            removeBtn.dataset.removeFileIndex = String(index);
            removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

            item.append(idx, name, removeBtn);
            fileListEl.appendChild(item);
        });

        if (!showMoreBtn) return;
        if (total > previewLimit) {
            showMoreBtn.hidden = false;
            showMoreBtn.textContent = showAll ? 'Show less' : `Show ${total - previewLimit} more`;
            showMoreBtn.setAttribute('aria-expanded', showAll ? 'true' : 'false');
        } else {
            showMoreBtn.hidden = true;
        }
    };

    const setFiles = (fileList) => {
        selectedFiles = normalizeIncomingFiles(fileList);
        showAllFiles = false;
        syncPromptText();
        renderFileList();
        setStepState(selectedFiles.length > 0);
    };

    return {
        setStepState,
        syncPromptText,
        renderFileList,
        setFiles,
        clearFiles() {
            setFiles([]);
        },
        toggleShowAll() {
            showAllFiles = !showAllFiles;
            renderFileList();
        },
        removeFileAtIndex(index) {
            if (!Number.isInteger(index) || index < 0 || index >= selectedFiles.length) return false;
            selectedFiles.splice(index, 1);
            showAllFiles = false;
            syncPromptText();
            renderFileList();
            setStepState(selectedFiles.length > 0);
            return true;
        },
        getSelectedFiles() {
            return selectedFiles.slice();
        },
    };
}
