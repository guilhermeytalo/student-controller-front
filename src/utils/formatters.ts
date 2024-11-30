export const cpfFormatter = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export const validCpf = (value: string) => {
  // Remove non-digit characters
  const cpf = value.replace(/\D/g, '')

  // Check if CPF has 11 digits
  if (cpf.length !== 11) {
    return 'CPF must have 11 digits'
  }

  // Check for known invalid CPF patterns
  const invalidCpfs = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999',
  ]

  if (invalidCpfs.includes(cpf)) {
    return 'CPF Inválido'
  }

  // Calculate verification digits
  let sum = 0
  let remainder

  // First verification digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  remainder = remainder === 10 ? 0 : remainder

  if (remainder !== parseInt(cpf.substring(9, 10))) {
    return 'CPF Inválido'
  }

  // Second verification digit
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  remainder = remainder === 10 ? 0 : remainder

  if (remainder !== parseInt(cpf.substring(10, 11))) {
    return 'Invalid CPF'
  }

  // If all checks pass
  return true
}
