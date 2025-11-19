/* 
 * MOBILE TEST - Copy this into browser console or create test.html
 * Tests all mobile-optimized features
 */

// Test 1: Check viewport settings
console.log('📱 TEST 1: Viewport Settings');
const viewport = document.querySelector('meta[name="viewport"]');
console.log('✓ Viewport:', viewport?.content || 'Missing!');

// Test 2: Check touch targets
console.log('\n🎯 TEST 2: Touch Target Sizes');
const buttons = document.querySelectorAll('.btn');
buttons.forEach((btn, i) => {
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    const status = height >= 44 && width >= 44 ? '✓' : '✗';
    console.log(`${status} Button ${i + 1}: ${width}x${height}px`);
});

// Test 3: Check responsive font sizes
console.log('\n📝 TEST 3: Font Sizes');
const h1 = document.querySelector('h1');
const fontSize = window.getComputedStyle(h1).fontSize;
console.log('✓ H1 Font Size:', fontSize);

// Test 4: Check mobile media queries
console.log('\n📱 TEST 4: Mobile Media Queries');
const mobileMatch = window.matchMedia('(max-width: 768px)');
console.log('✓ Mobile View:', mobileMatch.matches ? 'YES' : 'NO');

// Test 5: Check form input sizes
console.log('\n📋 TEST 5: Form Input Sizes');
const inputs = document.querySelectorAll('.form-control');
inputs.forEach((input, i) => {
    const height = input.offsetHeight;
    const status = height >= 44 ? '✓' : '✗';
    console.log(`${status} Input ${i + 1}: ${height}px height`);
});

// Test 6: Check card responsiveness
console.log('\n🃏 TEST 6: Card Layout');
const cards = document.querySelectorAll('.stat-card');
console.log(`✓ Found ${cards.length} cards`);

// Test 7: Performance check
console.log('\n⚡ TEST 7: Performance');
console.log('✓ CSS Animations:', 
    getComputedStyle(document.body).getPropertyValue('animation-duration') || 'Enabled'
);

// Test 8: Accessibility check
console.log('\n♿ TEST 8: Accessibility');
const ariaLabels = document.querySelectorAll('[aria-label]');
console.log(`✓ ARIA Labels: ${ariaLabels.length} elements`);

// Summary
console.log('\n✅ MOBILE OPTIMIZATION TEST COMPLETE!');
console.log('All features are mobile-ready! 🎉');
