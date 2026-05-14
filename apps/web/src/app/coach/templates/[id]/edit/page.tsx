import { CoachTemplateForm } from '../../CoachTemplateForm'

export default async function EditCoachTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CoachTemplateForm templateId={id} />
}
