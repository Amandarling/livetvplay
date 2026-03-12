import { useEffect, useState } from "react"
import { EpgProgram, getEPG } from "@/lib/epgService"
import { XtreamCredentials } from "@/lib/xtream"

interface Props {
  credentials: XtreamCredentials
  streamId: string
}

export default function EpgOverlay({ credentials, streamId }: Props) {

  const [epg, setEpg] = useState<EpgProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {

      const data = await getEPG(
        credentials.server,
        credentials.username,
        credentials.password,
        streamId
      )

      setEpg(data)
      setLoading(false)
    }

    load()
  }, [streamId])

  if (loading) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        carregando epg...
      </div>
    )
  }

  if (!epg.length) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        epg não disponível
      </div>
    )
  }

  return (
    <div className="space-y-2">

      {epg.map((p, i) => {

        const start = new Date(p.start * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const end = new Date(p.end * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

        return (
          <div key={i} className="rounded-lg bg-secondary/30 p-2">

            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{start}</span>
              <span>{end}</span>
            </div>

            <p className="text-xs font-semibold">{p.title}</p>

            {p.description && (
              <p className="text-[10px] text-muted-foreground">
                {p.description}
              </p>
            )}

          </div>
        )
      })}

    </div>
  )
}