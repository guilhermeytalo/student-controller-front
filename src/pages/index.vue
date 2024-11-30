<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer expand-on-hover rail>
        <v-list>
          <v-list-item
            :prepend-avatar="avatar"
            title="Módulo Acadêmico"
          />
        </v-list>

        <v-divider />

        <v-list density="compact" nav>
          <v-list-item prepend-icon="mdi-account-multiple" title="Alunos" value="shared" />
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-card flat>
          <template #text>
            <div class="d-flex flex-sm-row flex-column align-sm-center">
              <v-text-field
                v-model="searchInput"
                class="cs-text-field"
                clearable
                hide-details
                label="Digite a sua busca"
                single-line
                variant="outlined"
                @click:clear="clearSearch"
                @keyup.enter="handleSearch"
              >
                <template #append-inner>
                  <v-btn
                    class="h-100"
                    color="primary"
                    prepend-icon="mdi-magnify"
                    variant="tonal"
                    @click="handleSearch"
                  >
                    Pesquisar
                  </v-btn>
                </template>
              </v-text-field>

              <v-btn class="ml-sm-4 ml-0 mt-4 mt-sm-0" :style="{ height: '5.4vh' }" variant="tonal" @click="openCreateDialog">
                Cadastrar Aluno
              </v-btn>
            </div>
          </template>
          <div v-if="loading" class="text-center">
            <v-progress-circular indeterminate :size="70" />
          </div>
          <div v-else-if="error">
            <v-snackbar
              v-model="snackbar"
            >
              {{ error }}

              <template #actions>
                <v-btn
                  color="pink"
                  variant="text"
                  @click="snackbar = false"
                >
                  <v-icon
                    class="me-2"
                    size="medium"
                  >
                    mdi-close-circle-outline
                  </v-icon>
                </v-btn>
              </template>
            </v-snackbar>
          </div>
          <div v-else>
            <v-data-table class="cs-table" :headers="headers" :items="filteredStudents" :sort-by="[{ key: 'academicRegister', order: 'asc' }]">
              <template #item.cpf="{ item }">
                {{ cpfFormatter(item.cpf) }}
              </template>

              <template #item.actions="{ item }">
                <v-icon
                  class="me-2"
                  size="small"
                  @click="editItem(item)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  @click="deleteStudent(item)"
                >
                  mdi-delete
                </v-icon>
              </template>
              <template #no-data>
                <div class="d-flex flex-column align-center">
                  <v-icon
                    class="me-4"
                    size="large"
                  >
                    mdi-close-circle
                  </v-icon>
                  Nenhum aluno encontrado
                </div>
              </template>
            </v-data-table>
          </div>
        </v-card>

        <v-dialog v-model="dialog" max-width="600">
          <v-card>
            <v-card-title>{{ editedIndex === -1 ? 'Cadastrar Aluno' : 'Editar Aluno' }}</v-card-title>
            <v-card-text>
              <v-form ref="form" @submit.prevent="saveStudent">
                <v-text-field
                  v-model="editedStudent.name"
                  :counter="20"
                  :error-messages="v$.name.$errors.map(e => e.$message)"
                  label="Nome"
                  required
                  @blur="v$.name.$touch()"
                />
                <v-text-field
                  v-model="editedStudent.academicRegister"
                  :counter="6"
                  :disabled="editedIndex > -1"
                  :error-messages="v$.academicRegister.$errors.map(e => e.$message)"
                  inputmode="numeric"
                  label="Registro Acadêmico"
                  pattern="[0-9]*"
                  required
                  type="text"
                  @blur="v$.academicRegister.$touch()"
                  @input="handleAcademicRegisterInput"
                />
                <v-text-field
                  v-model="editedStudent.cpf"
                  :disabled="editedIndex > -1"
                  :error-messages="v$.cpf.$errors.map(e => e.$message)"
                  inputmode="numeric"
                  label="CPF"
                  pattern="[0-9]*"
                  required
                  type="text"
                  :value="cpfFormatter(editedStudent.cpf)"
                  @blur="v$.cpf.$touch()"
                  @input="handleCpfInput"
                />
                <v-text-field
                  v-model="editedStudent.email"
                  :error-messages="v$.email.$errors.map(e => e.$message)"
                  label="E-mail"
                  required
                  @blur="v$.email.$touch()"
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" @click="saveStudent">Salvar</v-btn>
              <v-btn @click="close">Cancelar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Delete Dialog -->
        <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title>Tem certeza que deseja excluir este item?</v-card-title>
            <v-card-actions>
              <v-spacer />
              <v-btn color="error" @click="deleteStudentConfirm">Sim</v-btn>
              <v-btn @click="closeDelete">Não</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </v-main>
    </v-layout>
  </v-card>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useVuelidate } from '@vuelidate/core'
  import { email, helpers, maxLength, required } from '@vuelidate/validators'
  import type { DataTableHeader, Student } from '@/interfaces/studentInterface'
  import { studentService } from '@/api/studentService'
  import { cpfFormatter, validCpf } from '@/utils/formatters'

  import avatar from '@/assets/logo-grupoa-w.png'

  const registeredStudents = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const form = ref<any>(null)
  const snackbar = ref(false)

  const fetchStudents = async () => {
    try {
      loading.value = true
      registeredStudents.value = await studentService.getAllStudents()
    } catch (err) {
      error.value = 'Error fetching students'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchStudents()
  })

  const searchInput = ref('')
  const search = ref('')
  const dialog = ref(false)
  const dialogDelete = ref(false)
  const editedIndex = ref(-1)
  const editedStudent = ref<Student>({
    academicRegister: '',
    name: '',
    cpf: '',
    email: '',
  })
  const defaultItem = ref<Student>({
    academicRegister: '',
    name: '',
    cpf: '',
    email: '',
  })

  const clearSearch = () => {
    searchInput.value = ''
    search.value = ''
  }

  const handleSearch = () => {
    if (searchInput.value.trim() === '') {
      clearSearch()
    } else {
      search.value = searchInput.value
    }
  }

  watch(searchInput, newValue => {
    if (newValue.trim() === '') {
      search.value = ''
    }
  })

  const rules = computed(() => ({
    name: {
      required,
      maxLength: maxLength(20),
    },
    academicRegister: {
      required,
      maxLength: maxLength(6),
    },
    cpf: {
      required,
      validCpf: helpers.withMessage('CPF inválido', (value: string) =>
        validCpf(value) === true
      ),
      maxLength: maxLength(11),
    },
    email: {
      required,
      email,
    },
  }))

  const v$ = useVuelidate(rules, editedStudent)

  const handleCpfInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    editedStudent.value.cpf = input.value.replace(/\D/g, '')
  }

  const handleAcademicRegisterInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    editedStudent.value.academicRegister = input.value.replace(/\D/g, '')
  }

  const filteredStudents = computed(() => {
    if (!search.value) return registeredStudents.value
    return registeredStudents.value.filter(student =>
      Object.values(student).some(value =>
        value.toString().toLowerCase().includes(search.value.toLowerCase())
      )
    )
  })

  const headers: DataTableHeader[] = [
    {
      key: 'academicRegister',
      title: 'Registro Acadêmico',
      align: 'start',
    },
    {
      key: 'name',
      title: 'Nome',
    },
    { key: 'cpf', title: 'CPF' },
    { key: 'actions', title: 'Ações', sortable: false },
  ]

  const openCreateDialog = () => {
    editedIndex.value = -1
    editedStudent.value = { ...defaultItem.value }
    dialog.value = true
    v$.value.$reset()
  }

  const saveStudent = async () => {
    const isValid = await v$.value.$validate()
    if (!isValid) return

    try {
      loading.value = true
      const cleanedCpf = editedStudent.value.cpf.replace(/\D/g, '')
      if (editedIndex.value > -1) {
        const updatedStudent = await studentService.updateStudent(
          editedStudent.value.id!,
          editedStudent.value
        )
        const index = registeredStudents.value.findIndex(s => s.id === updatedStudent.id)
        if (index !== -1) registeredStudents.value[index] = updatedStudent
        await fetchStudents()
      } else {
        const student = {
          ...editedStudent.value,
          cpf: cleanedCpf,
        }
        const newStudent = await studentService.createStudent(student)
        registeredStudents.value.push(newStudent)
      }
      close()
    } catch (err) {
      snackbar.value = true
      error.value = 'Ocorreu um erro ao tentar salvar o estudante'
      console.error(err.response.data.error)
    } finally {
      loading.value = false
    }
  }

  const editItem = (item: Student) => {
    editedIndex.value = registeredStudents.value.findIndex(s => s.id === item.id)
    editedStudent.value = { ...item }
    dialog.value = true
  }

  const deleteStudent = (item: Student) => {
    editedIndex.value = registeredStudents.value.findIndex(s => s.id === item.id)
    editedStudent.value = { ...item }
    dialogDelete.value = true
  }

  const deleteStudentConfirm = async () => {
    try {
      if (!editedStudent.value.id) {
        throw new Error('No student selected for deletion')
      }

      loading.value = true
      await studentService.deleteStudent(editedStudent.value.id)

      const index = registeredStudents.value.findIndex(s => s.id === editedStudent.value.id)
      if (index !== -1) {
        registeredStudents.value.splice(index, 1)
      }

      closeDelete()
    } catch (err) {
      error.value = 'Error deleting student'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const close = () => {
    dialog.value = false
    editedStudent.value = { ...defaultItem.value }
    editedIndex.value = -1
    error.value = null
    v$.value.$reset()
  }

  const closeDelete = () => {
    dialogDelete.value = false
    editedStudent.value = { ...defaultItem.value }
    editedIndex.value = -1
    error.value = null
    v$.value.$reset()
  }
</script>

<style scoped>
.cs-text-field :deep(.v-field--appended) {
  padding-right: 0;
}

.cs-table {
  height: calc(100vh - 64px);
  overflow-y: auto;
  width: 100%;
}
</style>
