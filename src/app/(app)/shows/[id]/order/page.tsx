import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import OrderClient from "./OrderClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params
  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      acts: {
        include: { class: { include: { teacher: true } } },
        orderBy: { createdAt: "asc" },
      },
      actPositions: { orderBy: { position: "asc" } },
    },
  })

  if (!show) notFound()

  const classes = await prisma.class.findMany({
    where: { seasonId: show.seasonId },
    orderBy: { name: "asc" },
  })

  return <OrderClient show={show} classes={classes} />
}
