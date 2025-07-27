function navigateTo(page) {
  const bg = document.getElementById('bg-animation');
  bg.className = ''; // Remove all
  bg.classList.add('bg-' + page); // Add corresponding class

  // Example behavior
  console.log('Navigated to:', page);
}