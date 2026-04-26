import RecapClient from './RecapClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecapPage({ params }: Props) {
  const { id } = await params
  return <RecapClient sessionId={id} />
}
