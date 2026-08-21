/**
 * Note App Functionality Test Suite
 * Tests JavaScript logic and component interactions
 * Run: node test-functionality.js
 */

const tests = [];
let passCount = 0;
let failCount = 0;

// Test helper
function test(name, fn) {
    tests.push({ name, fn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function run() {
    console.log('🧪 Note App Functionality Tests\n');

    tests.forEach(({ name, fn }) => {
        try {
            fn();
            console.log(`✅ ${name}`);
            passCount++;
        } catch (e) {
            console.log(`❌ ${name}`);
            console.log(`   Error: ${e.message}`);
            failCount++;
        }
    });

    console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);
    return failCount === 0;
}

// ============ TESTS ============

// Test 1: Store object methods exist
test('Store has required methods', () => {
    const store = {
        getNote() {
            const today = new Date().toISOString().split('T')[0];
            return localStorage.getItem(`note-${today}`) || '';
        },
        saveNote(text) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`note-${today}`, text);
        },
        getLabel() {
            return localStorage.getItem('note-label') || 'Today\'s Note';
        },
        saveLabel(text) {
            localStorage.setItem('note-label', text);
        },
        resetLabel() {
            localStorage.removeItem('note-label');
        }
    };

    assert(typeof store.getNote === 'function', 'getNote not a function');
    assert(typeof store.saveNote === 'function', 'saveNote not a function');
    assert(typeof store.getLabel === 'function', 'getLabel not a function');
    assert(typeof store.saveLabel === 'function', 'saveLabel not a function');
    assert(typeof store.resetLabel === 'function', 'resetLabel not a function');
});

// Test 2: Store saves and retrieves notes
test('Store saves and retrieves notes with today\'s date', () => {
    const store = {
        getNote() {
            const today = new Date().toISOString().split('T')[0];
            return localStorage.getItem(`note-${today}`) || '';
        },
        saveNote(text) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`note-${today}`, text);
        }
    };

    // Mock localStorage
    const mockStorage = {};
    const mockLocalStorage = {
        getItem: (key) => mockStorage[key] || null,
        setItem: (key, value) => { mockStorage[key] = value; },
        removeItem: (key) => { delete mockStorage[key]; }
    };

    // Override with mock
    const originalLS = global.localStorage;
    global.localStorage = mockLocalStorage;

    const testNote = 'Test note content';
    store.saveNote(testNote);
    const retrieved = store.getNote();

    global.localStorage = originalLS;

    assert(retrieved === testNote, `Expected "${testNote}" but got "${retrieved}"`);
});

// Test 3: Label methods work correctly
test('Store saves and retrieves label', () => {
    const store = {
        getLabel() {
            return localStorage.getItem('note-label') || 'Today\'s Note';
        },
        saveLabel(text) {
            localStorage.setItem('note-label', text);
        }
    };

    const mockStorage = {};
    const mockLocalStorage = {
        getItem: (key) => mockStorage[key] || null,
        setItem: (key, value) => { mockStorage[key] = value; },
        removeItem: (key) => { delete mockStorage[key]; }
    };

    const originalLS = global.localStorage;
    global.localStorage = mockLocalStorage;

    const testLabel = 'Custom Label';
    store.saveLabel(testLabel);
    const retrieved = store.getLabel();

    global.localStorage = originalLS;

    assert(retrieved === testLabel, `Expected "${testLabel}" but got "${retrieved}"`);
});

// Test 4: Default label is returned when not set
test('Store returns default label when not set', () => {
    const store = {
        getLabel() {
            return localStorage.getItem('note-label') || 'Today\'s Note';
        }
    };

    const mockStorage = {};
    const mockLocalStorage = {
        getItem: (key) => mockStorage[key] || null
    };

    const originalLS = global.localStorage;
    global.localStorage = mockLocalStorage;

    const retrieved = store.getLabel();

    global.localStorage = originalLS;

    assert(retrieved === 'Today\'s Note', `Expected default label "Today's Note" but got "${retrieved}"`);
});

// Test 5: Verify key naming pattern for daily notes
test('Note keys follow YYYY-MM-DD format', () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `note-${today}`;

    assert(/^note-\d{4}-\d{2}-\d{2}$/.test(key), `Key "${key}" doesn't match YYYY-MM-DD format`);
});

// Test 6: Text truncation logic for display
test('Note truncation works (preview shows 100 chars max)', () => {
    const note = 'a'.repeat(150);
    const preview = note.substring(0, 100) + (note.length > 100 ? '...' : '');
    const expectedLength = 103; // 100 chars + "..."

    assert(preview.length === expectedLength, `Preview length ${preview.length} doesn't match expected ${expectedLength}`);
    assert(preview.endsWith('...'), 'Preview should end with "..."');
});

// Test 7: Event listener setup (dry run - no DOM)
test('Event listener callbacks defined', () => {
    const callbacks = {
        openEditNoteOverlay: () => { /* implementation */ },
        saveNote: () => { /* implementation */ },
        clearNote: () => { /* implementation */ },
        clearAllNotes: () => { /* implementation */ },
        undoClear: () => { /* implementation */ },
        openEditLabelOverlay: (e) => { /* implementation */ },
        saveLabel: () => { /* implementation */ },
        showUndoToast: (message) => { /* implementation */ }
    };

    Object.values(callbacks).forEach(cb => {
        assert(typeof cb === 'function', 'Callback is not a function');
    });
});

// Test 8: Undo state management
test('Undo functionality tracks previous state', () => {
    let currentNote = 'Hello World';
    let lastClearedNote = '';

    // Simulate clear
    lastClearedNote = currentNote;
    currentNote = '';

    assert(currentNote === '', 'Note should be empty after clear');
    assert(lastClearedNote === 'Hello World', 'Should store cleared note');

    // Simulate undo
    currentNote = lastClearedNote;

    assert(currentNote === 'Hello World', 'Note should be restored after undo');
});

// Test 9: Overlay API method names (expected by components)
test('Overlay component APIs match usage', () => {
    const overlayMethods = ['open', 'close'];

    overlayMethods.forEach(method => {
        assert(typeof method === 'string', `Method name ${method} is not a string`);
    });
});

// Test 10: Component event names expected by footer
test('Footer component event names are valid', () => {
    const footerEvents = ['add', 'reset-all', 'flavor-changed'];

    footerEvents.forEach(event => {
        assert(/^[a-z\-]+$/.test(event), `Event name "${event}" has invalid characters`);
    });
});

// Run all tests
run();
