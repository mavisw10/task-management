export const daysLeft = (dueDate) => {
  if (!dueDate) return null

  const today = new Date()
  const due = new Date(dueDate)

  // remove time difference
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffTime = due - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export const toSimpleDate = (timestamp) => {
  if (!timestamp) return ""

  const d = new Date(timestamp)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const disablePastDate = (time) => {
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  return time.getTime() < today.getTime()
}

export const disableFutureDate = (time) => {
  const today = new Date()

  today.setHours(23, 59, 59, 999)

  return time.getTime() > today.getTime()
}