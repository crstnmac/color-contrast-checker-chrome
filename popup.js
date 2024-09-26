document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {action: 'checkContrast'},
      function (response) {
        displayResults(response)
      }
    )
  })
})

function displayResults(results) {
  const resultsDiv = document.getElementById('results')
  resultsDiv.innerHTML = '' // Clear previous results

  if (results.length === 0) {
    resultsDiv.innerHTML =
      '<p>No visible color combinations found on this page.</p>'
    return
  }

  results.forEach((result) => {
    const contrastPair = document.createElement('div')
    contrastPair.className = 'contrast-pair'

    const colorSample = document.createElement('span')
    colorSample.className = 'color-sample'
    colorSample.style.backgroundColor = result.color
    colorSample.style.border = `1px solid ${
      result.color === 'rgb(255, 255, 255)' ? '#000' : '#fff'
    }`

    const bgColorSample = document.createElement('span')
    bgColorSample.className = 'color-sample'
    bgColorSample.style.backgroundColor = result.backgroundColor
    bgColorSample.style.border = `1px solid ${
      result.backgroundColor === 'rgb(255, 255, 255)' ? '#000' : '#fff'
    }`

    const statusIndicator = document.createElement('span')
    statusIndicator.className = 'status-indicator'
    statusIndicator.textContent = result.passes ? '✅ PASS' : '❌ FAIL'
    statusIndicator.style.color = result.passes ? 'green' : 'red'
    statusIndicator.style.fontWeight = 'bold'

    contrastPair.appendChild(colorSample)
    contrastPair.appendChild(bgColorSample)
    contrastPair.appendChild(
      document.createTextNode(
        `Foreground: ${result.color} Background: ${result.backgroundColor} ` +
          `Ratio: ${result.ratio} Elements: ${result.elementCount} `
      )
    )
    contrastPair.appendChild(statusIndicator)

    contrastPair.addEventListener('click', () =>
      focusElements(result.color, result.backgroundColor)
    )

    resultsDiv.appendChild(contrastPair)
  })
}

function focusElements(color, backgroundColor) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'focusElements',
      color: color,
      backgroundColor: backgroundColor,
    })
    window.close() // Close the popup after clicking
  })
}
