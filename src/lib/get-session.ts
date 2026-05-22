import { cache } from "react"
import { auth } from "@/lib/auth"

/** Une seule résolution session par requête RSC (layouts + pages). */
export const getSession = cache(() => auth())
