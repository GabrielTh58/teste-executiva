'use client'

import { useSession } from "@/shared/context/SessionContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "./LoadingSpinner"

export function ForceAuth(props: any){
    const { user, loading } = useSession()
    const router = useRouter()
    const path = usePathname()

    useEffect(() => {       
        if(!loading && !user?.sub){
            router.push(`/login?destino=${path}`) 
        }
    }, [loading, user, router, path])
   
    if(loading && !user?.sub) return <LoadingSpinner />

    return props.children
}