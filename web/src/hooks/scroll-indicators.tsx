import { Accessor } from "solid-js"
import { createMemo, onSettled, refresh } from "solid-js"

export function createScrollIndicators(scrollRef: Accessor<HTMLElement | null>) {
  const canScroll = createMemo(() => {
    if(scrollRef() == null) return {left: false, right: false}
    return {
      left: scrollRef()!.scrollLeft > 1,
      right: scrollRef()!.scrollLeft < (scrollRef()!.scrollWidth - scrollRef()!.clientWidth - 1)
    }
  })
  const canScrollLeft = () => canScroll().left
  const canScrollRight = () => canScroll().right

  function handleScroll() {
    refresh(canScroll)
  }

  onSettled(() => {
    if(scrollRef() == null) return

    const observer = new ResizeObserver(() => handleScroll())
    observer.observe(scrollRef()!)
    return () => observer.disconnect()
  })

  return { canScrollLeft, canScrollRight, handleScroll }
}
