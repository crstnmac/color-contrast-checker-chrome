function isElementVisible(element) {
  const style = window.getComputedStyle(element)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

function extractColors() {
  const elements = document.getElementsByTagName('*')
  const colorPairs = new Map()

  for (let element of elements) {
    if (!isElementVisible(element)) continue

    const style = window.getComputedStyle(element)
    const color = style.color
    const backgroundColor = style.backgroundColor

    if (
      color !== 'rgba(0, 0, 0, 0)' &&
      color !== 'transparent' &&
      backgroundColor !== 'rgba(0, 0, 0, 0)' &&
      backgroundColor !== 'transparent'
    ) {
      const key = `${color}|${backgroundColor}`
      if (!colorPairs.has(key)) {
        colorPairs.set(key, {color, backgroundColor, elements: []})
      }
      colorPairs.get(key).elements.push(element)
    }
  }

  return Array.from(colorPairs.values())
}

function calculateContrastRatio(color1, color2) {
  const luminance1 = calculateLuminance(color1)
  const luminance2 = calculateLuminance(color2)
  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)
  return (lighter + 0.05) / (darker + 0.05)
}

function calculateLuminance(color) {
  const rgb = color.match(/\d+/g).map(Number)
  const [r, g, b] = rgb.map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function checkContrast() {
  const colorPairs = extractColors()
  return colorPairs.map((pair) => {
    const ratio = calculateContrastRatio(pair.color, pair.backgroundColor)
    return {
      color: pair.color,
      backgroundColor: pair.backgroundColor,
      ratio: ratio.toFixed(2),
      passes: ratio >= 4.5, // WCAG AA standard for normal text
      elementCount: pair.elements.length,
    }
  })
}

function focusElements(color, backgroundColor) {
  const colorPairs = extractColors()
  const pair = colorPairs.find(
    (p) => p.color === color && p.backgroundColor === backgroundColor
  )

  if (pair && pair.elements.length > 0) {
    // Remove any existing focus effects
    const existingFocuses = document.querySelectorAll(
      '.accessibility-focus-outline'
    )
    existingFocuses.forEach((el) => el.remove())

    pair.elements.forEach((element, index) => {
      element.scrollIntoView({behavior: 'smooth', block: 'center'})

      // Create a new div for the focus effect
      const focusOutline = document.createElement('div')
      focusOutline.className = 'accessibility-focus-outline'

      // Position the focus outline
      const rect = element.getBoundingClientRect()
      focusOutline.style.position = 'fixed'
      focusOutline.style.top = `${rect.top - 5}px`
      focusOutline.style.left = `${rect.left - 5}px`
      focusOutline.style.width = `${rect.width + 10}px`
      focusOutline.style.height = `${rect.height + 10}px`
      focusOutline.style.border = '5px solid #FF4500' // High-contrast orange color
      focusOutline.style.boxShadow = '0 0 10px rgba(255, 69, 0, 0.7)'
      focusOutline.style.zIndex = '9999'
      focusOutline.style.pointerEvents = 'none' // Allows clicking through the outline

      document.body.appendChild(focusOutline)

      // Remove the focus effect after 5 seconds
      setTimeout(() => {
        focusOutline.remove()
      }, 5000)

      // Only scroll to the first element
      if (index === 0) {
        element.scrollIntoView({behavior: 'smooth', block: 'center'})
      }
    })
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkContrast') {
    sendResponse(checkContrast())
  } else if (request.action === 'focusElements') {
    focusElements(request.color, request.backgroundColor)
    sendResponse({success: true})
  }
})
