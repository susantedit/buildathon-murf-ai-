import { useState, useEffect } from 'react'

export default function TypewriterText({ text, speed = 60 }) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!text) {
      setDisplayedText('')
      setCurrentIndex(0)
      return
    }

    const words = text.split(' ')
    
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [text, currentIndex, speed])

  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])

  return <span>{displayedText}</span>
}
