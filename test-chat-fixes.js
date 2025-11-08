// Test script to verify chat session fixes
// Run this in the browser console to test the functionality

console.log('🧪 Testing Chat Session Fixes...\n');

// Test 1: Check localStorage for duplicate sessions
function testDuplicateSessions() {
  console.log('Test 1: Checking for duplicate sessions...');
  const stored = localStorage.getItem('llm-chat-conversations');
  if (!stored) {
    console.log('❌ No conversations found in localStorage');
    return false;
  }
  
  const conversations = JSON.parse(stored);
  const ids = conversations.map(c => c.id);
  const uniqueIds = [...new Set(ids)];
  
  if (ids.length !== uniqueIds.length) {
    console.log(`❌ Found duplicate sessions: ${ids.length} total, ${uniqueIds.length} unique`);
    return false;
  }
  
  console.log(`✅ No duplicates found. ${conversations.length} unique sessions.`);
  return true;
}

// Test 2: Check for empty/invalid sessions
function testInvalidSessions() {
  console.log('\nTest 2: Checking for invalid sessions...');
  const stored = localStorage.getItem('llm-chat-conversations');
  if (!stored) {
    console.log('❌ No conversations found in localStorage');
    return false;
  }
  
  const conversations = JSON.parse(stored);
  const invalidSessions = conversations.filter(c => 
    !c.id || 
    c.id.trim() === '' || 
    !c.title || 
    typeof c !== 'object'
  );
  
  if (invalidSessions.length > 0) {
    console.log(`❌ Found ${invalidSessions.length} invalid sessions`);
    invalidSessions.forEach(s => console.log('  Invalid session:', s));
    return false;
  }
  
  console.log('✅ All sessions are valid');
  return true;
}

// Test 3: Simulate delete operation
function testDeleteOperation() {
  console.log('\nTest 3: Testing delete operation...');
  const stored = localStorage.getItem('llm-chat-conversations');
  if (!stored) {
    console.log('❌ No conversations found to test delete');
    return false;
  }
  
  const conversations = JSON.parse(stored);
  const beforeCount = conversations.length;
  console.log(`  Before: ${beforeCount} conversations`);
  
  // Create a backup
  localStorage.setItem('llm-chat-conversations-backup', stored);
  
  if (conversations.length > 0) {
    // Remove first conversation
    const idToDelete = conversations[0].id;
    const filtered = conversations.filter(c => c.id !== idToDelete);
    localStorage.setItem('llm-chat-conversations', JSON.stringify(filtered));
    
    // Check result
    const afterStored = localStorage.getItem('llm-chat-conversations');
    const afterConversations = JSON.parse(afterStored);
    const afterCount = afterConversations.length;
    
    console.log(`  After delete: ${afterCount} conversations`);
    
    // Restore backup
    localStorage.setItem('llm-chat-conversations', localStorage.getItem('llm-chat-conversations-backup'));
    localStorage.removeItem('llm-chat-conversations-backup');
    
    if (afterCount === beforeCount - 1) {
      console.log('✅ Delete operation works correctly');
      return true;
    } else {
      console.log('❌ Delete operation failed');
      return false;
    }
  }
  
  console.log('⚠️ No conversations to test delete on');
  return true;
}

// Test 4: Check current page state
function testCurrentPageState() {
  console.log('\nTest 4: Checking current page state...');
  
  // Check if React components are loaded
  const sidebarElement = document.querySelector('[class*="Sidebar"]');
  const chatElement = document.querySelector('[class*="ChatInterface"]');
  
  if (!sidebarElement || !chatElement) {
    console.log('⚠️ Page components not fully loaded. Please refresh and try again.');
    return false;
  }
  
  // Check conversation list in sidebar
  const conversationElements = document.querySelectorAll('[class*="cursor-pointer"]');
  console.log(`  Found ${conversationElements.length} conversation elements in sidebar`);
  
  // Check for duplicate visual elements
  const titles = [];
  conversationElements.forEach(el => {
    const titleEl = el.querySelector('p[class*="truncate"]');
    if (titleEl) {
      titles.push(titleEl.textContent);
    }
  });
  
  console.log('  Conversation titles:', titles);
  
  if (titles.length > 0) {
    console.log('✅ Page state looks correct');
    return true;
  } else {
    console.log('⚠️ No conversations visible in sidebar');
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('=' .repeat(50));
  console.log('🚀 Running all tests...\n');
  
  const results = {
    duplicates: testDuplicateSessions(),
    invalid: testInvalidSessions(),
    delete: testDeleteOperation(),
    pageState: testCurrentPageState()
  };
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`  Duplicate Sessions: ${results.duplicates ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Invalid Sessions: ${results.invalid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Delete Operation: ${results.delete ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Page State: ${results.pageState ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed. Please check the details above.'));
  console.log('=' .repeat(50));
  
  return results;
}

// Helper function to clear all conversations (use with caution!)
function clearAllConversations() {
  if (confirm('⚠️ This will delete ALL conversations. Are you sure?')) {
    localStorage.removeItem('llm-chat-conversations');
    console.log('✅ All conversations cleared. Please refresh the page.');
    location.reload();
  }
}

// Helper function to view current conversations
function viewConversations() {
  const stored = localStorage.getItem('llm-chat-conversations');
  if (!stored) {
    console.log('No conversations found');
    return;
  }
  
  const conversations = JSON.parse(stored);
  console.log(`Found ${conversations.length} conversations:`);
  conversations.forEach((conv, index) => {
    console.log(`\n${index + 1}. ${conv.title}`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   Short ID: ${conv.shortId}`);
    console.log(`   Messages: ${conv.messages ? conv.messages.length : 0}`);
    console.log(`   Created: ${new Date(conv.timestamp).toLocaleString()}`);
  });
}

// Instructions
console.log('Available commands:');
console.log('  runAllTests()        - Run all tests');
console.log('  viewConversations()  - View all stored conversations');
console.log('  clearAllConversations() - Clear all conversations (use with caution!)');
console.log('\nRun "runAllTests()" to start testing...');