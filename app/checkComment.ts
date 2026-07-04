export async function checkCommentWithAI(comment: string, prevComments: string[]): Promise<boolean> {
  try {
    const response = await fetch('/api/check-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, prevComments }),
    })
    const data = await response.json()
    return data.approved === true
  } catch {
    return true
  }
}
