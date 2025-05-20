import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useTookMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  return !!isMobile
}
