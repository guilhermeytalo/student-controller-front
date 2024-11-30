export interface Student {
  id?: string;
  academicRegister: string;
  name: string;
  cpf: string;
  email: string;
}

export type DataTableHeader = {
  key: string
  title: string
  align?: 'start' | 'end' | 'center'
  sortable?: boolean
  width?: string | number
  render?: (value: any) => string
}
