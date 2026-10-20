<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PRIORITY, TranslatePriority } from '@/enum/priority';
import { STATUS, TranslateStatus } from '@/enum/status';
import { useGetCreateTaskMutation } from './query/useGetCreateTaskMutation';
import { useGetUpdateTaskMutation } from './query/useGetUpdateTaskMutation';
import { useGetDeleteTaskMutation } from './query/useGetDeleteTaskMutation';
import { useGetTaskListQuery } from './query/useGetTaskListQuery';
import { daysLeft, toSimpleDate, disablePastDate, disableFutureDate } from '@/utils/date';

const { t, locale } = useI18n();

const emptyForm = () => ({
    'id': null,
    'taskName': '',
    'description': '',
    'status': null,
    'priority': null,
    'dueDate': null,
    'createdOn': null
})

const filterForm = reactive({
    'taskName': '',
    'status': null,
    'priority': null,
    'dueDate': null,
    'createdOn': null
})

const taskForm = reactive(emptyForm())

const language = ref(locale.value);

const languageOptions = [
    {
        value: 'en-US',
        label: 'English',
    },
    {
        value: 'zh-CN',
        label: '中文',
    }
]

watch(language, (newLang) => {
    locale.value = newLang;
});

const isFilterVisible = ref(false);
const isDialogVisible = ref(false);
const dialogMode = ref('create');

const view = ref('all')

const filters = computed(() => ({
    taskName: filterForm.taskName,
    status: filterForm.status,
    priority: filterForm.priority,
    dueDate: filterForm.dueDate,
    createdOn: filterForm.createdOn
}))

const { data } = useGetTaskListQuery(filters)

const taskList = computed(() => data.value ?? [])

const activeCount = computed(() =>
    taskList.value.filter(task => task.status !== STATUS.COMPLETED).length)

const completedCount = computed(() =>
    taskList.value.filter(task => task.status === STATUS.COMPLETED).length)

const leftLabel = (row) => {
    const n = daysLeft(row.dueDate)
    if (n === null) return '—'
    if (n < 0) return t('days-overdue', { count: Math.abs(n) })
    if (n === 0) return t('due-today')
    if (n === 1) return t('day-left', { count: n })
    return t('days-left', { count: n })
}

const visibleTasks = computed(() => {
    if (view.value === 'active') {
        return taskList.value.filter(task => task.status !== STATUS.COMPLETED)
    }
    if (view.value === 'completed') {
        return taskList.value.filter(task => task.status === STATUS.COMPLETED)
    }
    return taskList.value
})

const { 'mutateAsync': createTask } = useGetCreateTaskMutation();
const { 'mutateAsync': updateTask } = useGetUpdateTaskMutation();
const { 'mutateAsync': deleteTask } = useGetDeleteTaskMutation();

function openCreateDialog()
{
    Object.assign(taskForm, emptyForm())
    dialogMode.value = 'create'
    isDialogVisible.value = true
}

function openEditDialog(row)
{
    Object.assign(taskForm, emptyForm(), {
        id: row.id,
        taskName: row.taskName,
        description: row.description ?? '',
        status: row.status,
        priority: row.priority,
        // keep the timestamp as a number: Element Plus renders a "x" (ms) formatted
        // value correctly as a number but misparses it when passed as a string
        dueDate: row.dueDate !== null && row.dueDate !== undefined && row.dueDate !== ''
            ? Number(row.dueDate)
            : null
    })
    dialogMode.value = 'edit'
    isDialogVisible.value = true
}

async function onSubmit()
{
    const payload = {
        taskName: String(taskForm.taskName ?? '').trim(),
        description: taskForm.description,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate
    }

    if (!payload.taskName || !payload.priority || !payload.dueDate) {
        ElMessage.warning(t('required-fields'))
        return
    }

    try {
        if (dialogMode.value === 'create') {
            await createTask(payload)
            ElMessage.success(t('task-created'))
        } else {
            await updateTask({ id: taskForm.id, patch: { ...payload, status: taskForm.status } })
            ElMessage.success(t('task-updated'))
        }
        isDialogVisible.value = false
    } catch {
        ElMessage.error(t('operation-failed'))
    }
}

async function onDelete(row)
{
    try {
        await ElMessageBox.confirm(
            t('delete-confirm'),
            t('warning'),
            {
                type: 'warning',
                confirmButtonText: t('delete'),
                cancelButtonText: t('cancel')
            }
        )
    } catch {
        return
    }

    try {
        await deleteTask(row.id)
        ElMessage.success(t('task-deleted'))
    } catch {
        ElMessage.error(t('operation-failed'))
    }
}
</script>

<template>
    <ElContainer class="bg-gray-100 p-5">
        <ElHeader>
            <ElSelect v-model="language" style="width: 100px" class="float-right">
                <ElOption v-for="item in languageOptions" :key="item.value" :label="item.label"
                    :value="item.value" />
            </ElSelect>
        </ElHeader>

        <ElMain>
            <div class=" bg-white p-5 rounded-2xl">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <ElIcon class="mt-1" size="25">
                            <Management />
                        </ElIcon>
                        <h1 class="ml-3">{{ $t('task-management') }}</h1>
                    </div>
                    <ElButton
                        type=primary
                        @click="openCreateDialog"
                    >
                        {{ t('new-task') }}
                    </ElButton>
                </div>
                <div>
                    {{ activeCount }} {{ $t('active-tasks') }} • {{ completedCount }} {{ $t('completed') }}
                </div>
            </div>
            <div class="mt-7 bg-white p-5 rounded-2xl">
                <div class="flex">
                    <ElRadioGroup v-model="view" style="margin-bottom: 30px">
                        <ElRadioButton value="all">{{ $t('all') }}</ElRadioButton>
                        <ElRadioButton value="active">{{ $t('active') }}</ElRadioButton>
                        <ElRadioButton value="completed">{{ $t('completed') }}</ElRadioButton>
                    </ElRadioGroup>
                    <ElButton
                        type=primary
                        class="ml-5"
                        @click="isFilterVisible = !isFilterVisible"
                    >
                        {{ t('filter') }}
                        <ElIcon class="el-icon--right">
                            <ArrowDown />
                        </ElIcon>
                    </ElButton>
                </div>
                <div v-if="isFilterVisible" >
                    <ElForm :model="filterForm" class="flex gap-4">
                        <ElFormItem class="flex-1">
                            <ElInput v-model="filterForm.taskName" :placeholder="t('task-name')" />
                        </ElFormItem>
                        <ElFormItem class="flex-1">
                            <ElSelect v-model="filterForm.status" :placeholder="t('status')" clearable>
                                <ElOption v-for="value in STATUS" :key="value" :value="value"
                                    :label="TranslateStatus(value)" />
                            </ElSelect>
                        </ElFormItem>
                        <ElFormItem class="flex-1">
                            <ElSelect v-model="filterForm.priority" :placeholder="t('priority')" clearable>
                                <ElOption v-for="value in PRIORITY" :key="value" :value="value"
                                    :label="TranslatePriority(value)" />
                            </ElSelect>
                        </ElFormItem>
                        <ElFormItem class="flex-1">
                            <ElDatePicker
                                v-model="filterForm.dueDate"
                                :placeholder="t('due-date')"
                                value-format="x"
                                style="width:100%"
                                :disabled-date="disablePastDate"
                            />
                        </ElFormItem>
                        <ElFormItem class="flex-1">
                            <ElDatePicker
                                v-model="filterForm.createdOn"
                                :placeholder="t('created-on')"
                                value-format="x"
                                style="width:100%"
                                :disabled-date="disableFutureDate"
                            />
                        </ElFormItem>
                    </ElForm>
                </div>

                <ElTable :data="visibleTasks" :border="true" class="mt-6" :empty-text="t('no-data')">
                    <ElTableColumn prop="id" :label="t('id')" sortable/>
                    <ElTableColumn prop="taskName" :label="t('task-name')" />
                    <ElTableColumn prop="status" :label="t('status')"
                    >
                        <template #default="{ row }">
                            {{  TranslateStatus(row.status) }}
                        </template>
                    </ElTableColumn>
                    <ElTableColumn prop="priority" :label="t('priority')" sortable>
                         <template #default="{ row }">
                            {{  TranslatePriority(row.priority) }}
                        </template>
                    </ElTableColumn>
                    <ElTableColumn prop="leftDays" :label="t('left')" sortable>
                        <template #default="{ row }">
                            {{ row.status === STATUS.COMPLETED || !row.dueDate
                                ? '—'
                                : leftLabel(row) }}
                        </template>
                    </ElTableColumn>
                    <ElTableColumn prop="dueDate" :label="t('due-date')" sortable>
                        <template #default="{ row }">
                            {{ toSimpleDate(row.dueDate) }}
                        </template>
                    </ElTableColumn>
                    <ElTableColumn prop="createdOn" :label="t('created-on')" sortable>
                        <template #default="{ row }">
                            {{ toSimpleDate(row.createdOn) }}
                        </template>
                    </ElTableColumn>

                    <ElTableColumn :label="t('action')" width="110">
                        <template #default="{ row }">
                            <ElButton link type="primary" @click="openEditDialog(row)">
                                <ElIcon><Edit /></ElIcon>
                            </ElButton>
                            <ElButton link type="danger" @click="onDelete(row)">
                                <ElIcon><Delete /></ElIcon>
                            </ElButton>
                        </template>
                    </ElTableColumn>
                </ElTable>
            </div>

            <ElDialog
                v-model="isDialogVisible"
                width="40%"
                center
                align-center
                class="flex flex-col items-center"
            >
                <template #header="{ titleId, titleClass }">
                    <h1 :id="titleId" :class="titleClass">
                        {{ dialogMode === 'create' ? $t('new-task') : $t('edit-task') }}
                    </h1>
                </template>

                <ElForm :model="taskForm" label-width="auto" size="large" class="mt-4 w-full max-w-[550px]">
                    <ElFormItem :label="t('task-name')">
                        <ElInput v-model="taskForm.taskName" />
                    </ElFormItem>
                    <ElFormItem :label="t('description')">
                        <ElInput v-model="taskForm.description" type="textarea" rows="6"/>
                    </ElFormItem>
                    <ElFormItem v-if="dialogMode === 'edit'" :label="t('status')">
                        <ElSelect v-model="taskForm.status">
                            <ElOption v-for="value in STATUS" :key="value" :value="value"
                                :label="TranslateStatus(value)" />
                        </ElSelect>
                    </ElFormItem>
                    <ElFormItem :label="t('priority')">
                        <ElSelect v-model="taskForm.priority">
                            <ElOption v-for="value in PRIORITY" :key="value" :value="value"
                                :label="TranslatePriority(value)" />
                        </ElSelect>
                    </ElFormItem>
                    <ElFormItem :label="t('due-date')">
                        <ElDatePicker v-model="taskForm.dueDate" value-format="x" style="width:100%"/>
                    </ElFormItem>
                    <ElFormItem class="float-right">
                        <ElButton type="primary" @click="onSubmit">
                            {{ dialogMode === 'create' ? $t('create') : $t('save') }}
                        </ElButton>
                        <ElButton @click="isDialogVisible = false">{{ $t('cancel') }}</ElButton>
                    </ElFormItem>
                </ElForm>
            </ElDialog>
        </ElMain>
    </ElContainer>
</template>

<style scoped>
.el-dialog__title {
    color: #409EFF;
}

:deep(.el-dialog__body) {
    width: 100%;
    display: flex;
    justify-content: center;
}
</style>
