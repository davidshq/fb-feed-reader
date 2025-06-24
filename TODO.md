# Facebook Feed Reader - Refactoring TODO

## Major Refactoring Opportunities

### 1. **Class Size and Single Responsibility Principle Violation**
The `FacebookFeedReader` class is doing too much - it's handling DOM manipulation, storage management, event handling, and UI creation. This violates the Single Responsibility Principle.

**Recommendation**: Split into multiple classes:
- `FeedItemProcessor` - Handle feed item detection and processing
- `StorageManager` - Handle Chrome storage operations
- `UIManager` - Handle checkmark creation and positioning
- `ObserverManager` - Handle mutation observers

### 2. **Repetitive Error Handling**
Every method has the same try-catch pattern with console.error logging. This creates code duplication.

**Recommendation**: Create a decorator or utility function for error handling:

```javascript
const withErrorHandling = (methodName) => (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;
  descriptor.value = async function(...args) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      console.error(`Facebook Feed Reader: Error in ${methodName}:`, error);
    }
  };
  return descriptor;
};
```

### 3. **Complex Selector Management**
The `findFeedItems()` method has a large array of selectors that's hard to maintain and understand.

**Recommendation**: Extract selectors into a configuration object and create a selector strategy pattern:

```javascript
const SELECTOR_STRATEGIES = {
  highPriority: ['[role="article"][aria-posinset]'],
  mediumPriority: ['[data-pagelet*="FeedUnit"]', '[data-testid*="post"]'],
  // ...
};
```

### 4. **ID Generation Logic Complexity**
The `generateItemId()` method has multiple fallback strategies that make it hard to understand and maintain.

**Recommendation**: Create separate classes for different ID generation strategies:

```javascript
class IdGenerator {
  static generate(item) {
    return new AriaLabelledByIdStrategy()
      .or(new AriaCombinationIdStrategy())
      .or(new FacebookIdStrategy())
      .or(new FallbackIdStrategy())
      .generate(item);
  }
}
```

### 5. **Global State Management**
The code uses global variables (`feedReader`, `currentUrl`) which can lead to issues with multiple instances and testing.

**Recommendation**: Use a singleton pattern or dependency injection:

```javascript
class FeedReaderManager {
  static instance = null;
  
  static getInstance() {
    if (!FeedReaderManager.instance) {
      FeedReaderManager.instance = new FacebookFeedReader();
    }
    return FeedReaderManager.instance;
  }
}
```

### 6. **Hardcoded Values and Magic Numbers**
The code contains many hardcoded values (timeouts, z-index, positioning) that should be constants.

**Recommendation**: Extract to a configuration object:

```javascript
const CONFIG = {
  TIMEOUTS: {
    INITIAL_PROCESS: 2000,
    DEBOUNCE: 500,
    FADE_OUT: 300,
    REINITIALIZE: 1000
  },
  STYLES: {
    CHECKMARK_Z_INDEX: 9999,
    CHECKMARK_TOP: '10px',
    CHECKMARK_RIGHT: '10px'
  }
};
```

### 7. **Async/Await Inconsistency**
Some methods are async but don't need to be, while others could benefit from being async.

**Recommendation**: Review and standardize async usage based on actual needs.

### 8. **DOM Query Performance**
Multiple `querySelectorAll` calls in `findFeedItems()` can be expensive.

**Recommendation**: Use more efficient selectors and consider caching results:

```javascript
class FeedItemCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = 0;
  }
  
  getItems() {
    if (Date.now() - this.lastUpdate > 1000) {
      this.updateCache();
    }
    return this.cache.values();
  }
}
```

### 9. **Event Listener Management**
Event listeners are added but never removed, which can cause memory leaks.

**Recommendation**: Implement proper cleanup:

```javascript
class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  addListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.listeners.set(element, { event, handler });
  }
  
  cleanup() {
    this.listeners.forEach(({ event, handler }, element) => {
      element.removeEventListener(event, handler);
    });
  }
}
```

### 10. **Testing Difficulties**
The current structure makes unit testing difficult due to tight coupling and global state.

**Recommendation**: Implement dependency injection and make methods more testable:

```javascript
class FacebookFeedReader {
  constructor(storageManager, uiManager, observerManager) {
    this.storageManager = storageManager;
    this.uiManager = uiManager;
    this.observerManager = observerManager;
  }
}
```

## Priority Refactoring Order

1. **Extract constants and configuration** (Quick win, low risk)
2. **Split into smaller classes** (High impact, medium risk)
3. **Implement proper error handling** (Medium impact, low risk)
4. **Add proper cleanup and memory management** (High impact, medium risk)
5. **Improve ID generation strategy** (Medium impact, medium risk)

## Current Issues Summary

- **Maintainability**: Large monolithic class with multiple responsibilities
- **Performance**: Inefficient DOM queries and potential memory leaks
- **Testability**: Tight coupling and global state make testing difficult
- **Code Quality**: Repetitive error handling and hardcoded values
- **Scalability**: Current structure doesn't support easy feature additions

The code is functional but would benefit significantly from these refactoring efforts to improve maintainability, testability, and performance. 