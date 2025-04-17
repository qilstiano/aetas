"use client"

import { useEffect, useRef, useState } from "react"

export function MetallicGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resizeCanvas = () => {
      const { innerWidth: width, innerHeight: height } = window
      canvas.width = width
      canvas.height = height
      setDimensions({ width, height })
    }

    // Create noise texture once
    const createNoiseTexture = () => {
      const noiseCanvas = document.createElement("canvas")
      const noiseSize = 256
      noiseCanvas.width = noiseSize
      noiseCanvas.height = noiseSize

      const noiseCtx = noiseCanvas.getContext("2d")
      if (!noiseCtx) return null

      const imageData = noiseCtx.createImageData(noiseSize, noiseSize)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Subtle noise - mostly transparent
        const value = Math.floor(Math.random() * 40) // Low intensity noise
        data[i] = data[i + 1] = data[i + 2] = value
        data[i + 3] = Math.random() * 30 // Very transparent
      }

      noiseCtx.putImageData(imageData, 0, 0)
      return noiseCanvas
    }

    const noiseTexture = createNoiseTexture()

    const render = () => {
      if (!ctx || !canvas) return

      time += 0.002

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.8,
      )

      // Black to purple gradient with subtle animation
      const purpleIntensity = Math.sin(time * 0.5) * 0.1 + 0.3 // Oscillate between 0.2 and 0.4

      gradient.addColorStop(0, `rgba(20, 10, 30, 1)`) // Dark center
      gradient.addColorStop(0.4, `rgba(15, 5, 20, 1)`) // Near-black
      gradient.addColorStop(0.8, `rgba(13, 0, ${60 + Math.sin(time) * 20}, ${purpleIntensity})`) // Animated purple
      gradient.addColorStop(1, `rgb(26, 4, 48)`) // Dark edge

      // Fill background with gradient
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Apply noise texture with low opacity
      if (noiseTexture) {
        ctx.globalAlpha = 0.15

        // Animate noise by changing position slightly
        const offsetX = Math.sin(time * 0.3) * 50
        const offsetY = Math.cos(time * 0.2) * 50

        // Tile the noise texture
        const scale = 1.5
        for (let x = 0; x < canvas.width; x += noiseTexture.width * scale) {
          for (let y = 0; y < canvas.height; y += noiseTexture.height * scale) {
            ctx.drawImage(
              noiseTexture,
              x + offsetX,
              y + offsetY,
              noiseTexture.width * scale,
              noiseTexture.height * scale,
            )
          }
        }

        ctx.globalAlpha = 1.0
      }

      // Add subtle light spots
      const numSpots = 3
      for (let i = 0; i < numSpots; i++) {
        const x = canvas.width * (0.2 + 0.6 * Math.sin(time * 0.1 + (i * Math.PI * 2) / numSpots))
        const y = canvas.height * (0.2 + 0.6 * Math.cos(time * 0.15 + (i * Math.PI * 2) / numSpots))

        const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, canvas.width * 0.4)
        spotGradient.addColorStop(0, `rgba(100, 50, 150, ${0.05 + Math.sin(time + i) * 0.02})`)
        spotGradient.addColorStop(0.5, `rgba(60, 20, 100, ${0.03 + Math.sin(time + i) * 0.01})`)
        spotGradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = spotGradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    render()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  )
}
