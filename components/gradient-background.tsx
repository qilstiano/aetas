"use client"

import { useEffect, useRef } from "react"

export function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let hue = 0
    let direction = 1

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createGradient = (hue: number) => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)

      // Subtle pastel colors that change slowly
      const color1 = `hsla(${hue}, 30%, 95%, 0.3)`
      const color2 = `hsla(${(hue + 60) % 360}, 30%, 95%, 0.3)`
      const color3 = `hsla(${(hue + 120) % 360}, 30%, 95%, 0.3)`

      gradient.addColorStop(0, color1)
      gradient.addColorStop(0.5, color2)
      gradient.addColorStop(1, color3)

      return gradient
    }

    const render = () => {
      // Slowly change hue
      hue = (hue + 0.1 * direction) % 360
      if (hue > 180 || hue < 0) direction *= -1

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create and apply gradient
      const gradient = createGradient(hue)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

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

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full" style={{ pointerEvents: "none" }} />
}
