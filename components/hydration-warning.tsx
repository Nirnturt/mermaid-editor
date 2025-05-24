"use client"

// import { useEffect, useState } from 'react'
// import { XCircle } from "lucide-react"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter
// } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"

export function HydrationWarning() {
  // const [showWarning, setShowWarning] = useState(false)
  // const [didHydrate, setDidHydrate] = useState(false)
  
  // First check if we've hydrated
  // useEffect(() => {
  //   setDidHydrate(true)
    
  //   // Check for localStorage availability (might be disabled in some browsers)
  //   try {
  //     // Check if user has dismissed this warning before
  //     const hasDismissed = localStorage.getItem('hydration-warning-dismissed') === 'true'
      
  //     if (!hasDismissed) {
  //       // Look for "inmaintabuse" attribute which indicates extension interference
  //       const hasExtensionAttribute = document.body.hasAttribute('inmaintabuse')
  //       // Check if any elements have filter:none inline style
  //       const hasFilterNone = document.body.innerHTML.includes('filter:none') || 
  //                            document.body.innerHTML.includes('filter:"none"') ||
  //                            document.body.innerHTML.includes('filter: none')
        
  //       setShowWarning(hasExtensionAttribute || hasFilterNone)
  //     }
  //   } catch (err) {
  //     // If localStorage is not available, we'll just show the warning if there's extension interference
  //     console.warn('LocalStorage not available:', err)
  //     const hasExtensionAttribute = document.body.hasAttribute('inmaintabuse')
  //     const hasFilterNone = document.body.innerHTML.includes('filter:none') || 
  //                          document.body.innerHTML.includes('filter:"none"') ||
  //                          document.body.innerHTML.includes('filter: none')
      
  //     setShowWarning(hasExtensionAttribute || hasFilterNone)
  //   }
  // }, [])
  
  // const handleDismiss = () => {
  //   try {
  //     // Remember that user has dismissed this warning
  //     localStorage.setItem('hydration-warning-dismissed', 'true')
  //   } catch (err) {
  //     console.warn('Unable to save preference:', err)
  //   }
  //   setShowWarning(false)
  // }
  
  // Don't render anything on server or until hydration is complete
  // if (!didHydrate) return null
  
  return null; // Directly return null to disable the warning
} 